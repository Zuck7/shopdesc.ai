import { Link } from "react-router-dom";
import {
  Package,
  FileText,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UsageBar } from "@/components/billing/UsageBar";
import { useAnalytics } from "@/hooks/useUser";
import { useUsage } from "@/hooks/useBilling";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-4">
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: usage, isLoading: usageLoading } = useUsage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome to ShopDesc.ai — your AI product description generator.
        </p>
      </div>

      {/* Usage */}
      <Card>
        <CardContent className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Monthly usage</p>
            <p className="text-xs capitalize text-muted-foreground">
              {usageLoading ? (
                <Skeleton className="inline-block h-3 w-16" />
              ) : (
                `${usage?.plan ?? "free"} plan`
              )}
            </p>
          </div>
          {usageLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : (
            <UsageBar
              used={usage?.monthlyGenerations ?? 0}
              limit={usage?.generationLimit ?? 5}
            />
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {analyticsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : analytics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total products"
            value={analytics.totalProducts}
            icon={Package}
          />
          <StatCard
            label="Total generations"
            value={analytics.totalGenerations}
            icon={FileText}
          />
          <StatCard
            label="Avg SEO score"
            value={analytics.avgSeoScore.toFixed(1)}
            icon={TrendingUp}
          />
          <StatCard
            label="Total cost"
            value={`$${analytics.totalCost.toFixed(2)}`}
            icon={DollarSign}
          />
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link to="/products/new">
          <Button>Add product</Button>
        </Link>
        <Link to="/generate">
          <Button variant="outline">Generate descriptions</Button>
        </Link>
        <Link to="/analytics">
          <Button variant="outline">View analytics</Button>
        </Link>
      </div>
    </div>
  );
}
