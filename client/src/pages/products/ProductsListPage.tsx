import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/products/ProductTable";

export function ProductsListPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your product catalog.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/products/import">
            <Button variant="outline">Import CSV</Button>
          </Link>
          <Link to="/products/new">
            <Button>Add product</Button>
          </Link>
        </div>
      </div>

      <ProductTable />
    </div>
  );
}
