import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VariantCard } from "@/components/generations/VariantCard";
import { SeoScoreBadge } from "@/components/generations/SeoScoreBadge";
import { useGenerationDetail } from "@/hooks/useGenerations";

export function GenerationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: gen, isLoading, isError } = useGenerationDetail(id!);

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-16 text-sm">
        Loading generation…
      </div>
    );
  }

  if (isError || !gen) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-sm mb-4">
          Generation not found.
        </p>
        <Link to="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  const productName =
    typeof gen.productId === "object" ? gen.productId.name : "Product";

  const avgSeo =
    gen.variants.length > 0
      ? Math.round(
          gen.variants.reduce((s, v) => s + (v.seoScore ?? 0), 0) /
            gen.variants.length
        )
      : 0;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Breadcrumb */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>{" "}
          /{" "}
          <Link to="/generate" className="hover:underline">
            Generate
          </Link>{" "}
          / Results
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Generation for {productName}
        </h1>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Platform</p>
            <Badge variant="outline" className="mt-1 capitalize">
              {gen.platform}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tone</p>
            <Badge variant="outline" className="mt-1 capitalize">
              {gen.tone}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg SEO Score</p>
            <div className="mt-1">
              <SeoScoreBadge score={avgSeo} />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Processing Time</p>
            <p className="font-medium mt-1">
              {(gen.processingTimeMs / 1000).toFixed(1)}s
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tokens Used</p>
            <p className="font-medium mt-1">
              {gen.totalTokensUsed.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estimated Cost</p>
            <p className="font-medium mt-1">${gen.costEstimate.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Variants</p>
            <p className="font-medium mt-1">{gen.variants.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Generated</p>
            <p className="font-medium mt-1">
              {new Date(gen.createdAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Variant Tabs */}
      {gen.variants.length > 0 && (
        <Tabs defaultValue={gen.variants[0]._id}>
          <TabsList>
            {gen.variants.map((v) => (
              <TabsTrigger key={v._id} value={v._id}>
                {v.variantLabel}
              </TabsTrigger>
            ))}
          </TabsList>
          {gen.variants.map((v) => (
            <TabsContent key={v._id} value={v._id}>
              <VariantCard variant={v} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
