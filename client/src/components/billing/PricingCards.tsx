import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePlans, useSubscribe } from "@/hooks/useBilling";
import { Skeleton } from "@/components/ui/skeleton";

interface PricingCardsProps {
  currentPlan?: string;
}

export function PricingCards({ currentPlan }: PricingCardsProps) {
  const { data: plans, isLoading } = usePlans();
  const subscribe = useSubscribe();

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {plans?.map((plan) => {
        const isCurrent = currentPlan === plan.name;
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
                {plan.features.map((feature) => (
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
              {plan.name === "free" ? (
                <Button variant="outline" className="w-full" disabled>
                  {isCurrent ? "Current plan" : "Free"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || subscribe.isPending}
                  onClick={() => subscribe.mutate(plan.name)}
                >
                  {isCurrent ? "Current plan" : "Upgrade"}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
