import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProducts } from "@/hooks/useProducts";
import { useGenerateSingle } from "@/hooks/useGenerations";
import { toast } from "sonner";

const PLATFORMS = ["shopify", "amazon", "etsy", "woocommerce", "generic"] as const;
const TONES = ["professional", "casual", "luxury", "playful", "custom"] as const;

export function GeneratePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedProduct = searchParams.get("productId") ?? "";

  const [productId, setProductId] = useState(preselectedProduct);
  const [platform, setPlatform] = useState<string>("shopify");
  const [tone, setTone] = useState<string>("professional");
  const [customTone, setCustomTone] = useState("");
  const [includeCompetitor, setIncludeCompetitor] = useState(false);

  const { data: productData, isLoading: productsLoading } = useProducts({
    limit: 200,
  });
  const products = productData?.products ?? [];

  const generate = useGenerateSingle(productId);

  const handleGenerate = async () => {
    if (!productId) {
      toast.error("Select a product first");
      return;
    }
    try {
      const result = await generate.mutateAsync({
        platform,
        tone,
        custom_tone_instructions: tone === "custom" ? customTone : undefined,
        include_competitor_analysis: includeCompetitor,
      });
      toast.success("Description generated!");
      navigate(`/results/${result.id}`);
    } catch {
      toast.error("Generation failed — please try again");
    }
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <p className="text-xs text-muted-foreground mb-1">
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>{" "}
          / Generate
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Generate Description
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Choose a product and generation settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product */}
          <div className="space-y-1.5">
            <Label htmlFor="product">Product</Label>
            <Select
              id="product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={productsLoading}
            >
              <option value="">
                {productsLoading ? "Loading…" : "Select a product"}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <Label htmlFor="platform">Platform</Label>
            <Select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <Label htmlFor="tone">Tone</Label>
            <Select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Custom Tone */}
          {tone === "custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="custom-tone">Custom Tone Instructions</Label>
              <Textarea
                id="custom-tone"
                rows={3}
                placeholder="Describe the tone you want…"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
              />
            </div>
          )}

          {/* Competitor Analysis */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeCompetitor}
              onChange={(e) => setIncludeCompetitor(e.target.checked)}
              className="rounded border-input"
            />
            Include competitor analysis (slower but richer results)
          </label>

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={generate.isPending || !productId}
          >
            {generate.isPending ? "Generating…" : "Generate Description"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
