import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CsvUpload } from "@/components/products/CsvUpload";
import { ShopifySyncButton } from "@/components/products/ShopifySyncButton";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

export function ImportProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuthStore();

  // After Shopify OAuth completes, the server redirects here with ?shopify=connected.
  // We refresh the user record so the store domain is reflected in the UI immediately.
  useEffect(() => {
    if (searchParams.get("shopify") === "connected") {
      api
        .get<{ user: typeof user }>("/auth/me")
        .then(({ data }) => {
          if (data.user) updateUser(data.user);
          toast.success("Shopify store connected! You can now sync your products.");
        })
        .catch(() => {
          toast.success("Shopify store connected!");
        });
    }

    if (searchParams.get("shopify_error")) {
      const errorMessages: Record<string, string> = {
        invalid_state: "OAuth state mismatch — please try again.",
        expired_state: "The authorization session expired. Please try again.",
        invalid_shop: "The shop domain changed during authorization.",
        invalid_hmac: "Could not verify the Shopify callback. Please try again.",
        user_not_found: "Could not find your account. Please log in and try again.",
        server_error: "A server error occurred during Shopify authorization.",
      };
      const code = searchParams.get("shopify_error") ?? "server_error";
      toast.error(errorMessages[code] ?? "Shopify authorization failed.");
    }
  }, [searchParams, updateUser]);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bulk-import products from a CSV file or your Shopify store.
          </p>
        </div>
        <Link to="/products">
          <Button variant="outline" size="sm">Back</Button>
        </Link>
      </div>

      {/* CSV import */}
      <Card>
        <CardHeader>
          <CardTitle>CSV upload</CardTitle>
          <CardDescription>
            Max file size: 5 MB. Use <code>|</code> to separate multiple values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvUpload
            onSuccess={({ imported }) => {
              setTimeout(() => navigate("/products"), 1500);
              void imported;
            }}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Shopify import */}
      <Card>
        <CardHeader>
          <CardTitle>Shopify store sync</CardTitle>
          <CardDescription>
            Connect your Shopify store to import and keep your products in sync.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShopifySyncButton
            shopifyDomain={user?.shopifyDomain}
            onSuccess={() => navigate("/products")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
