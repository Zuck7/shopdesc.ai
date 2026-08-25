import { Link } from "react-router-dom";
import {
  Package,
  Sparkles,
  Layers,
  Upload,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UsageBar } from "@/components/billing/UsageBar";
import { useProducts } from "@/hooks/useProducts";
import { useBulkJobs } from "@/hooks/useGenerations";
import { useBillingStatus } from "@/hooks/useBilling";
import type { IBulkJob } from "@/types/generation";

const statusVariant: Record<
  IBulkJob["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  queued: "secondary",
  processing: "default",
  completed: "outline",
  failed: "destructive",
  cancelled: "secondary",
};

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string | number;
  icon: typeof Package;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold tabular-nums">{value}</p>
          )}
        </div>
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const products = useProducts({ limit: 1 });
  const jobs = useBulkJobs();
  const billing = useBillingStatus();

  const productCount = products.data?.pagination.total ?? 0;
  const recentJobs = (jobs.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Turn product data into SEO-optimized listings with four collaborating
          AI agents.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Products"
          value={productCount}
          icon={Package}
          loading={products.isLoading}
        />
        <StatCard
          label="Generations this month"
          value={billing.data?.monthlyGenerations ?? 0}
          icon={Sparkles}
          loading={billing.isLoading}
        />
        <StatCard
          label="Bulk jobs"
          value={jobs.data?.length ?? 0}
          icon={Layers}
          loading={jobs.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent bulk jobs</CardTitle>
            <Link to="/generate/bulk">
              <Button variant="ghost" size="sm">
                New job <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {jobs.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : recentJobs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No bulk jobs yet. Select some products and run your first batch.
              </p>
            ) : (
              <ul className="divide-y">
                {recentJobs.map((job) => (
                  <li key={job.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/generate/jobs/${job.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {job.totalProducts} product
                        {job.totalProducts === 1 ? "" : "s"} · {job.platform}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {job.completedProducts}/{job.totalProducts}
                      </span>
                      <Badge variant={statusVariant[job.status]}>
                        {job.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {billing.isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <UsageBar
                    used={billing.data?.monthlyGenerations ?? 0}
                    limit={billing.data?.generationLimit ?? 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current plan:{" "}
                    <span className="font-medium capitalize">
                      {billing.data?.plan ?? "free"}
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link to="/generate">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="mr-2 h-4 w-4" /> Generate a description
                </Button>
              </Link>
              <Link to="/products/import">
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="mr-2 h-4 w-4" /> Import products
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" /> View analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
