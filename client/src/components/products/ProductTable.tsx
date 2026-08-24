import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { useDeleteProduct } from "@/hooks/useProducts";
import type { IProduct, ProductListParams } from "@/types/product";
import { toast } from "sonner";

const SOURCE_LABELS: Record<IProduct["source"], string> = {
  manual: "Manual",
  csv: "CSV",
  shopify: "Shopify",
};

interface ProductTableProps {
  onSelect?: (product: IProduct) => void;
}

export function ProductTable({ onSelect }: ProductTableProps) {
  const [params, setParams] = useState<ProductListParams>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError } = useProducts(params);
  const deleteProduct = useDeleteProduct();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, page: 1, search: searchInput || undefined }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const setPage = (page: number) => setParams((p) => ({ ...p, page }));

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle>Products</CardTitle>
        <div className="flex gap-2 mt-3">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <Input
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={params.source ?? ""}
            onChange={(e) =>
              setParams((p) => ({
                ...p,
                page: 1,
                source: (e.target.value as IProduct["source"]) || undefined,
              }))
            }
          >
            <option value="">All sources</option>
            <option value="manual">Manual</option>
            <option value="csv">CSV</option>
            <option value="shopify">Shopify</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Loading...
          </div>
        )}
        {isError && (
          <div className="p-6 text-center text-destructive text-sm">
            Failed to load products.
          </div>
        )}
        {data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Name</th>
                    <th className="text-left px-4 py-2 font-medium">Category</th>
                    <th className="text-left px-4 py-2 font-medium">Brand</th>
                    <th className="text-left px-4 py-2 font-medium">Source</th>
                    <th className="text-left px-4 py-2 font-medium">Price</th>
                    <th className="text-right px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No products found.
                      </td>
                    </tr>
                  )}
                  {data.products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2">
                        {onSelect ? (
                          <button
                            className="text-primary underline-offset-4 hover:underline text-left"
                            onClick={() => onSelect(product)}
                          >
                            {product.name}
                          </button>
                        ) : (
                          <Link
                            to={`/products/${product.id}`}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {product.name}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {product.category ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {product.brand ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {SOURCE_LABELS[product.source]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {product.price != null
                          ? `${product.currency} ${product.price.toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Link to={`/products/${product.id}`}>
                            <Button variant="ghost" size="icon-sm">
                              <span className="sr-only">View</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(product.id)}
                            disabled={deleteProduct.isPending}
                          >
                            <span className="sr-only">Delete</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {data.pagination.total} products — page {data.pagination.page}{" "}
                  of {data.pagination.pages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page <= 1}
                    onClick={() => setPage(data.pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page >= data.pagination.pages}
                    onClick={() => setPage(data.pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
