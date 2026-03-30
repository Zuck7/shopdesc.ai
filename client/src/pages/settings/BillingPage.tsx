import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PricingCards } from "@/components/billing/PricingCards";
import { UsageBar } from "@/components/billing/UsageBar";
import { useUsage, usePortalSession } from "@/hooks/useBilling";

export function BillingPage() {
  const { data: usage, isLoading } = useUsage();
  const portal = usePortalSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription and usage.
        </p>
      </div>

      {/* Current plan & usage */}
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="capitalize">{usage?.plan ?? "free"}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <UsageBar
                used={usage?.monthlyGenerations ?? 0}
                limit={usage?.generationLimit ?? 5}
              />
              {usage?.usageResetDate && (
                <p className="text-xs text-muted-foreground">
                  Resets on{" "}
                  {new Date(usage.usageResetDate).toLocaleDateString()}
                </p>
              )}
            </>
          )}

          {usage?.plan !== "free" && (
            <Button
              variant="outline"
              onClick={() => portal.mutate()}
              disabled={portal.isPending}
            >
              Manage subscription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Plans</h2>
        <PricingCards currentPlan={usage?.plan} />
      </div>
    </div>
  );
}
