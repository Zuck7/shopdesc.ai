import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { ProductForm } from "@/components/products/ProductForm";
import { toast } from "sonner";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const { data: product, isLoading, isError } = useProduct(id!);
  const updateProduct = useUpdateProduct(id!);
  const deleteProduct = useDeleteProduct();

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-16 text-sm">
        Loading...
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-sm mb-4">Product not found.</p>
        <Link to="/products">
          <Button variant="outline">Back to products</Button>
        </Link>
      </div>
    );
  }

  const handleUpdate = async (payload: Parameters<typeof updateProduct.mutateAsync>[0]) => {
    try {
      await updateProduct.mutateAsync(payload);
      toast.success("Product updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await deleteProduct.mutateAsync(id!);
      toast.success("Product deleted");
      navigate("/products");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            <Link to="/products" className="hover:underline">
              Products
            </Link>{" "}
            / {product.name}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteProduct.isPending}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edit product</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ProductForm
              initialData={product}
              onSubmit={handleUpdate}
              isLoading={updateProduct.isPending}
              submitLabel="Update product"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Category" value={product.category} />
              <Detail label="Subcategory" value={product.subcategory} />
              <Detail label="Brand" value={product.brand} />
              <Detail label="Source">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                  {product.source}
                </span>
              </Detail>
              <Detail
                label="Price"
                value={
                  product.price != null
                    ? `${product.currency} ${product.price.toFixed(2)}`
                    : undefined
                }
              />
              <Detail label="Target audience" value={product.targetAudience} />
            </CardContent>
          </Card>

          {product.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {product.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {product.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {product.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {product.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {product.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{children ?? (value || "—")}</p>
    </div>
  );
}
