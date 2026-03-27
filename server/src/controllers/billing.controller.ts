import type { Response, Request } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { stripe, PLAN_CONFIG, type PlanName } from "../config/stripe.js";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

// GET /api/billing/plans
export const getPlans = async (_req: Request, res: Response) => {
  const plans = [
    { name: "free", price: 0, limit: 5, features: ["5 products/month", "All platforms", "3 variants per product"] },
    { name: "starter", price: 29, limit: 100, features: ["100 products/month", "All platforms", "3 variants per product", "Bulk generation", "CSV export"] },
    { name: "pro", price: 79, limit: 1000, features: ["1,000 products/month", "All platforms", "3 variants per product", "Bulk generation", "CSV + JSON export", "Competitor analysis", "Priority processing"] },
    { name: "enterprise", price: 199, limit: -1, features: ["Unlimited products", "All platforms", "3 variants per product", "Bulk generation", "CSV + JSON export", "Competitor analysis", "Priority processing", "API access", "Dedicated support"] },
  ];
  res.json(plans);
};

// POST /api/billing/subscribe
export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!stripe) {
      res.status(503).json({ message: "Billing not configured" });
      return;
    }

    const user = req.user!;
    const { plan } = req.body as { plan: PlanName };

    const config = PLAN_CONFIG[plan];
    if (!config || !config.priceId) {
      res.status(400).json({ message: "Invalid plan" });
      return;
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: config.priceId, quantity: 1 }],
      success_url: `${env.CLIENT_URL}/settings/billing?success=true`,
      cancel_url: `${env.CLIENT_URL}/settings/billing?canceled=true`,
      metadata: { userId: user._id.toString(), plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error("Checkout session error:", err);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};

// POST /api/billing/portal
export const createPortalSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!stripe) {
      res.status(503).json({ message: "Billing not configured" });
      return;
    }

    const user = req.user!;
    if (!user.stripeCustomerId) {
      res.status(400).json({ message: "No billing account found" });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${env.CLIENT_URL}/settings/billing`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error("Portal session error:", err);
    res.status(500).json({ message: "Failed to create portal session" });
  }
};

// GET /api/billing/usage
export const getUsage = async (req: AuthRequest, res: Response) => {
  const user = req.user!;

  // Check if usage needs reset
  const now = new Date();
  if (now > user.usageResetDate) {
    const nextReset = new Date(now);
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);
    nextReset.setHours(0, 0, 0, 0);

    await User.findByIdAndUpdate(user._id, {
      monthlyGenerations: 0,
      usageResetDate: nextReset,
    });

    res.json({
      plan: user.plan,
      monthlyGenerations: 0,
      generationLimit: user.generationLimit,
      usageResetDate: nextReset,
    });
    return;
  }

  res.json({
    plan: user.plan,
    monthlyGenerations: user.monthlyGenerations,
    generationLimit: user.generationLimit,
    usageResetDate: user.usageResetDate,
  });
};

// POST /api/billing/webhook
export const handleWebhook = async (req: Request, res: Response) => {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(503).json({ message: "Webhook not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error("Webhook signature verification failed:", err);
    res.status(400).json({ message: "Invalid signature" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = (session.metadata?.plan ?? "starter") as PlanName;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (userId) {
          const limit = PLAN_CONFIG[plan]?.limit ?? 100;
          await User.findByIdAndUpdate(userId, {
            plan,
            stripeSubscriptionId: subscriptionId,
            generationLimit: limit === Infinity ? 999999 : limit,
          });
          logger.info(`User ${userId} subscribed to ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        if (subscription.status === "active") {
          // Find which plan by matching price ID
          const priceId = subscription.items.data[0]?.price.id;
          const planEntry = Object.entries(PLAN_CONFIG).find(
            ([, cfg]) => cfg.priceId === priceId
          );
          const plan = (planEntry?.[0] ?? "starter") as PlanName;
          const limit = PLAN_CONFIG[plan]?.limit ?? 100;

          await User.findOneAndUpdate(
            { stripeCustomerId: customerId },
            {
              plan,
              stripeSubscriptionId: subscription.id,
              generationLimit: limit === Infinity ? 999999 : limit,
            }
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await User.findOneAndUpdate(
          { stripeCustomerId: customerId },
          {
            plan: "free",
            stripeSubscriptionId: undefined,
            generationLimit: PLAN_CONFIG.free.limit,
          }
        );
        logger.info(`Subscription cancelled for customer ${customerId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        logger.warn(`Payment failed for customer ${customerId}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error("Webhook handler error:", err);
    res.status(500).json({ message: "Webhook handler error" });
  }
};
