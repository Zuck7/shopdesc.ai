import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeoScoreBadge } from "./SeoScoreBadge";
import type { IVariant } from "@/types/generation";

interface VariantCardProps {
  variant: IVariant;
}

export function VariantCard({ variant }: VariantCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{variant.variantLabel}</CardTitle>
          <Badge
            variant={
              variant.status === "approved"
                ? "default"
                : variant.status === "rejected"
                  ? "destructive"
                  : "secondary"
            }
          >
            {variant.status}
          </Badge>
        </div>
        <CardDescription>{variant.wordCount} words</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Title</p>
          <p className="font-semibold">{variant.title}</p>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Description
          </p>
          <p className="text-sm whitespace-pre-wrap">{variant.description}</p>
        </div>

        {/* Meta */}
        {variant.metaTitle && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Meta Title
            </p>
            <p className="text-sm">{variant.metaTitle}</p>
          </div>
        )}
        {variant.metaDescription && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Meta Description
            </p>
            <p className="text-sm">{variant.metaDescription}</p>
          </div>
        )}

        {/* Bullet Points */}
        {variant.bulletPoints.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Bullet Points
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {variant.bulletPoints.map((bp, i) => (
                <li key={i}>{bp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Keywords */}
        {variant.keywords.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Keywords
            </p>
            <div className="flex flex-wrap gap-1">
              {variant.keywords.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Scores */}
        <div className="flex gap-2 pt-2">
          {variant.seoScore != null && (
            <SeoScoreBadge score={variant.seoScore} />
          )}
          {variant.readabilityScore != null && (
            <SeoScoreBadge score={variant.readabilityScore} label="Read" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
