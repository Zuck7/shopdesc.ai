import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  IProduct,
  ProductListParams,
  ProductListResponse,
  CreateProductPayload,
  UpdateProductPayload,
} from "@/types/product";

const PRODUCTS_KEY = "products";

export function useProducts(params: ProductListParams = {}) {
  return useQuery<ProductListResponse>({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () =>
      api.get("/products", { params }).then((r) => r.data),
  });
}

export function useProduct(id: string) {
  return useQuery<IProduct>({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      api.post<IProduct>("/products", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) =>
      api.put<IProduct>(`/products/${id}`, payload).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData([PRODUCTS_KEY, id], updated);
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/products/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useImportShopify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api
        .post<{ total: number; imported: number; updated: number; shop: string }>(
          "/products/import/shopify"
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useImportCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api
        .post<{ imported: number; skipped: number; errors: Array<{ row: number; message: string }> }>(
          "/products/import/csv",
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        )
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}