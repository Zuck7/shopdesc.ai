import { Badge } from "@/components/ui/badge";

interface SeoScoreBadgeProps {
  score: number;
  label?: string;
}

function getVariant(score: number) {
  if (score >= 80) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

export function SeoScoreBadge({ score, label = "SEO" }: SeoScoreBadgeProps) {
  return (
    <Badge variant={getVariant(score)}>
      {label}: {score}/100
    </Badge>
  );
}
