import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/products/ProductForm";
import { useCreateProduct } from "@/hooks/useProducts";
import { toast } from "sonner";

export function NewProductPage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();

  const handleSubmit = async (payload: Parameters<typeof createProduct.mutateAsync>[0]) => {
    try {
      const product = await createProduct.mutateAsync(payload);
      toast.success("Product created");
      navigate(`/products/${product._id}`);
    } catch {
      toast.error("Failed to create product");
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New product</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a product manually to your catalog.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            onSubmit={handleSubmit}
            isLoading={createProduct.isPending}
            submitLabel="Create product"
          />
        </CardContent>
      </Card>
    </div>
  );
}
