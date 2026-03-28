import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

const PLANS = [
  {
    name: "free",
    price: 0,
    limit: 5,
    features: [
      "5 generations/month",
      "Single product generation",
      "3 description variants",
      "Basic SEO scoring",
    ],
  },
  {
    name: "starter",
    price: 29,
    limit: 100,
    stripePriceId: env.STRIPE_STARTER_PRICE_ID,
    features: [
      "100 generations/month",
      "Bulk generation",
      "CSV import",
      "Platform formatting",
      "Priority support",
    ],
  },
  {
    name: "pro",
    price: 79,
    limit: 1000,
    stripePriceId: env.STRIPE_PRO_PRICE_ID,
    features: [
      "1,000 generations/month",
      "Competitor analysis",
      "Shopify sync",
      "Advanced analytics",
      "Custom brand voice",
      "Priority support",
    ],
  },
  {
    name: "enterprise",
    price: 199,
    limit: 999999,
    stripePriceId: env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      "Unlimited generations",
      "API access",
      "Competitor analysis",
      "Dedicated account manager",
      "Custom integrations",
      "SSO & team management",
    ],
  },
];

export const getPlans = (_req: Request, res: Response) => {
  // Return plans without internal Stripe price IDs
  const plans = PLANS.map(({ stripePriceId: _s, ...rest }) => rest);
  res.json(plans);
};

export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { priceId } = req.body as { priceId: string };
    const user = req.user!;

    if (!env.STRIPE_SECRET_KEY) {
      res.status(503).json({ message: "Billing is not configured" });
      return;
    }

    // Dynamic import to avoid crash when Stripe is not configured
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

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
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.CLIENT_URL}/dashboard?billing=success`,
      cancel_url: `${env.CLIENT_URL}/dashboard?billing=cancelled`,
    });

    res.json({ url: session.url });
  } catch (error) {
    logger.error("Checkout session error:", error);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};

export const createPortalSession = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user!;

    if (!env.STRIPE_SECRET_KEY || !user.stripeCustomerId) {
      res
        .status(400)
        .json({ message: "No active subscription to manage" });
      return;
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${env.CLIENT_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (error) {
    logger.error("Portal session error:", error);
    res.status(500).json({ message: "Failed to create portal session" });
  }
};

export const getUsage = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    res.json({
      plan: user.plan,
      monthlyGenerations: user.monthlyGenerations,
      generationLimit: user.generationLimit,
      usageResetDate: user.usageResetDate,
    });
  } catch (error) {
    logger.error("Get usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      res.status(503).json({ message: "Billing webhooks not configured" });
      return;
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    const sig = req.headers["stripe-signature"] as string;
    const event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Look up which price they subscribed to
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );
        const priceId = subscription.items.data[0]?.price.id;

        const plan = PLANS.find((p) => p.stripePriceId === priceId);
        if (plan) {
          await User.findOneAndUpdate(
            { stripeCustomerId: customerId },
            {
              plan: plan.name,
              generationLimit: plan.limit,
              stripeSubscriptionId: subscriptionId,
            }
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await User.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          {
            plan: "free",
            generationLimit: 5,
            stripeSubscriptionId: undefined,
          }
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error("Webhook error:", error);
    res.status(400).json({ message: "Webhook error" });
  }
};
