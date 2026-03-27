import { cn } from "@/lib/utils";

interface UsageBarProps {
  used: number;
  limit: number;
  className?: string;
}

export function UsageBar({ used, limit, className }: UsageBarProps) {
  const isUnlimited = limit >= 999999;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = pct >= 80;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {used.toLocaleString()} / {isUnlimited ? "∞" : limit.toLocaleString()}
        </span>
        {!isUnlimited && (
          <span
            className={cn(
              "font-medium",
              isNearLimit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {pct.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isNearLimit ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: isUnlimited ? "0%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}
