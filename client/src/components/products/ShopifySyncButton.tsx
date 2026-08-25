import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImportShopify } from "@/hooks/useProducts";
import { api } from "@/lib/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

interface ShopifySyncButtonProps {
  /** Pass the user's connected shop domain if they already linked a store. */
  shopifyDomain?: string;
  /** Called after a successful connect or sync so the parent can refresh state. */
  onSuccess?: () => void;
}

/**
 * ShopifySyncButton handles two states:
 *
 * NOT CONNECTED — shows a form to enter the store domain and initiates OAuth:
 *   1. POST /api/auth/shopify/preauth  (with Bearer token)
 *   2. Server sets a signed httpOnly cookie and returns the Shopify auth URL
 *   3. We navigate the browser to that URL (full-page redirect — required for OAuth)
 *   4. Shopify redirects back to our callback, which redirects to /products/import?shopify=connected
 *
 * ALREADY CONNECTED — shows a "Sync products" button that:
 *   1. POST /api/products/import/shopify
 *   2. Shows a toast with the result (# imported / updated)
 */
export function ShopifySyncButton({ shopifyDomain, onSuccess }: ShopifySyncButtonProps) {
  const [shop, setShop] = useState(shopifyDomain ?? "");
  const [connecting, setConnecting] = useState(false);
  const importShopify = useImportShopify();

  const handleConnect = async () => {
    const normalised = shop.trim().toLowerCase();
    if (!normalised) {
      toast.error("Enter your store domain first.");
      return;
    }

    // Accept "mystore" shorthand → expand to full domain
    const fullDomain = normalised.includes(".myshopify.com")
      ? normalised
      : `${normalised}.myshopify.com`;

    setConnecting(true);
    try {
      const { data } = await api.post<{ authUrl: string }>("/auth/shopify/preauth", {
        shop: fullDomain,
      });
      // Full-page navigation is required — fetch/axios can't follow the Shopify
      // redirect because it's a cross-origin browser flow.
      window.location.href = data.authUrl;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to start Shopify connection.";
      toast.error(message);
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    try {
      const result = await importShopify.mutateAsync();
      toast.success(
        `Sync complete — ${result.imported} new, ${result.updated} updated from ${result.shop}`
      );
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Sync failed.";
      toast.error(message);
    }
  };

  // ── Already connected ────────────────────────────────────────────────────
  if (shopifyDomain) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
          Connected to <span className="font-medium text-foreground">{shopifyDomain}</span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            disabled={importShopify.isPending}
          >
            {importShopify.isPending ? "Syncing…" : "Sync products"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Navigate to the connect flow to link a different store
              window.location.href = `${API_BASE_URL}/api/auth/shopify/preauth`;
            }}
          >
            Change store
          </Button>
        </div>
      </div>
    );
  }

  // ── Not connected ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="shopify-domain">Shopify store domain</Label>
        <div className="flex gap-2">
          <Input
            id="shopify-domain"
            placeholder="mystore.myshopify.com"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleConnect()}
            className="max-w-xs"
          />
          <Button onClick={() => void handleConnect()} disabled={connecting}>
            {connecting ? "Redirecting…" : "Connect Shopify"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          You can enter just the store name (e.g. <code>mystore</code>) or the full{" "}
          <code>.myshopify.com</code> domain.
        </p>
      </div>
    </div>
  );
}
