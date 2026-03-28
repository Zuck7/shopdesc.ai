import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, BarChart3, Zap, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Descriptions",
    description:
      "Generate SEO-optimized product descriptions using advanced AI agents that analyze your products and competitors.",
  },
  {
    icon: BarChart3,
    title: "SEO Scoring & Analytics",
    description:
      "Get instant SEO scores and detailed analytics to track your content performance over time.",
  },
  {
    icon: Zap,
    title: "Bulk Generation",
    description:
      "Process hundreds of products at once with our bulk generation queue. Import via CSV or Shopify sync.",
  },
  {
    icon: ShieldCheck,
    title: "Platform-Ready Formatting",
    description:
      "Export descriptions formatted for Shopify, Amazon, WooCommerce, and more — ready to publish.",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-bold">ShopDesc.ai</span>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          AI Product Descriptions That{" "}
          <span className="text-primary">Sell</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Generate SEO-optimized, conversion-ready product descriptions in
          seconds. Powered by multi-agent AI analysis.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/register">
            <Button size="lg">Start free — 5 generations/mo</Button>
          </Link>
          <a href="#pricing">
            <Button variant="outline" size="lg">
              View pricing
            </Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold">
            Everything you need to write better product copy
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="space-y-2">
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold">
            Simple, transparent pricing
          </h2>
          <LandingPricingGrid />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ShopDesc.ai. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

/* Inline pricing grid for the landing page (no auth needed) */
import { usePlans, type Plan } from "@/hooks/useBilling";
import { Check } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function LandingPricingGrid() {
  const { data: plans, isLoading } = usePlans();

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {plans?.map((plan: Plan) => {
        const isPopular = plan.name === "pro";
        return (
          <Card
            key={plan.name}
            className={cn(
              "relative flex flex-col",
              isPopular && "ring-2 ring-primary"
            )}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="capitalize">{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground">/mo</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="mb-3 text-sm text-muted-foreground">
                {plan.limit === 999999
                  ? "Unlimited generations"
                  : `${plan.limit} generations/mo`}
              </p>
              <ul className="space-y-2">
                {plan.features.map((feature: string) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4">
              <Link to="/register" className="w-full">
                <Button
                  className="w-full"
                  variant={plan.name === "free" ? "outline" : "default"}
                >
                  {plan.name === "free" ? "Start free" : "Get started"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
