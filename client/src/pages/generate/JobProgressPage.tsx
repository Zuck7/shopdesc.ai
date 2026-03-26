import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useBulkJobStatus } from "@/hooks/useGenerations";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  queued: "outline",
  processing: "secondary",
  completed: "default",
  failed: "destructive",
  cancelled: "destructive",
};

export function JobProgressPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: job, isLoading, isError } = useBulkJobStatus(jobId!);

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-16 text-sm">
        Loading job…
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-sm mb-4">Job not found.</p>
        <Link to="/generate/jobs">
          <Button variant="outline">Back to jobs</Button>
        </Link>
      </div>
    );
  }

  const pct =
    job.totalProducts > 0
      ? Math.round(
          ((job.completedProducts + job.failedProducts) / job.totalProducts) *
            100
        )
      : 0;

  const isDone = job.status === "completed" || job.status === "failed";

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <p className="text-xs text-muted-foreground mb-1">
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>{" "}
          /{" "}
          <Link to="/generate" className="hover:underline">
            Generate
          </Link>{" "}
          / Job Progress
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Bulk Generation Job
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progress</CardTitle>
            <Badge variant={STATUS_VARIANT[job.status] ?? "outline"} className="capitalize">
              {job.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={pct} />
          <p className="text-sm text-muted-foreground text-center">
            {pct}% — {job.completedProducts + job.failedProducts} of{" "}
            {job.totalProducts} products processed
          </p>

          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-semibold text-green-600">
                {job.completedProducts}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold text-red-600">
                {job.failedProducts}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-semibold">
                {job.totalProducts -
                  job.completedProducts -
                  job.failedProducts}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Platform</p>
              <p className="font-medium capitalize">{job.platform}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tone</p>
              <p className="font-medium capitalize">{job.tone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Queued At</p>
              <p className="font-medium">
                {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>
            {job.completedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Completed At</p>
                <p className="font-medium">
                  {new Date(job.completedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isDone && (
        <div className="flex gap-3">
          <Link to="/generate/bulk" className="flex-1">
            <Button variant="outline" className="w-full">
              New Bulk Job
            </Button>
          </Link>
          <Link to="/dashboard" className="flex-1">
            <Button className="w-full">Back to Dashboard</Button>
          </Link>
        </div>
      )}

      {!isDone && (
        <p className="text-xs text-muted-foreground text-center">
          This page updates automatically every 2 seconds.
        </p>
      )}
    </div>
  );
}
