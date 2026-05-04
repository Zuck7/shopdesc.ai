import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { useGenerateBulk } from "@/hooks/useGenerations";
import { toast } from "sonner";
import type { IProduct } from "@/types/product";

const PLATFORMS = ["shopify", "amazon", "etsy", "woocommerce", "generic"] as const;
const TONES = ["professional", "casual", "luxury", "playful", "custom"] as const;

export function BulkGeneratePage() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [platform, setPlatform] = useState<string>("shopify");
  const [tone, setTone] = useState<string>("professional");
  const [customTone, setCustomTone] = useState("");
  const [includeCompetitor, setIncludeCompetitor] = useState(false);
  const [search, setSearch] = useState("");

  const { data: productData, isLoading: productsLoading } = useProducts({
    limit: 500,
  });
  const products = productData?.products ?? [];

  const filtered = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const bulkGenerate = useGenerateBulk();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one product");
      return;
    }
    try {
      const job = await bulkGenerate.mutateAsync({
        productIds: [...selected],
        platform,
        tone,
        custom_tone_instructions: tone === "custom" ? customTone : undefined,
        include_competitor_analysis: includeCompetitor,
      });
      toast.success(`Bulk job queued — ${selected.size} products`);
      navigate(`/generate/jobs/${job.id}`);
    } catch {
      toast.error("Failed to start bulk generation");
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <p className="text-xs text-muted-foreground mb-1">
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>{" "}
          /{" "}
          <Link to="/generate" className="hover:underline">
            Generate
          </Link>{" "}
          / Bulk
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Bulk Generate Descriptions
        </h1>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Configure generation settings for all selected products.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
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
          </div>

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

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeCompetitor}
              onChange={(e) => setIncludeCompetitor(e.target.checked)}
              className="rounded border-input"
            />
            Include competitor analysis (slower but richer results)
          </label>
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle>
            Select Products{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({selected.size} selected)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />

          {productsLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Loading products…
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No products found.
            </p>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sm cursor-pointer border-b pb-2">
                <input
                  type="checkbox"
                  checked={
                    filtered.length > 0 && selected.size === filtered.length
                  }
                  onChange={toggleAll}
                  className="rounded border-input"
                />
                Select all ({filtered.length})
              </label>

              <div className="max-h-72 overflow-y-auto space-y-1">
                {filtered.map((p: IProduct) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="rounded border-input"
                    />
                    <span className="truncate">{p.name}</span>
                    {p.category && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {p.category}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={bulkGenerate.isPending || selected.size === 0}
      >
        {bulkGenerate.isPending
          ? "Starting…"
          : `Generate for ${selected.size} Product${selected.size !== 1 ? "s" : ""}`}
      </Button>
    </div>
  );
}
