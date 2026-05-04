export interface IProduct {
  id: string;
  userId: string;
  source: "manual" | "csv" | "shopify";
  externalId?: string;
  name: string;
  category?: string;
  subcategory?: string;
  features: string[];
  benefits: string[];
  price?: number;
  currency: string;
  images: string[];
  brand?: string;
  targetAudience?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  source?: "manual" | "csv" | "shopify";
  category?: string;
}

export interface ProductListResponse {
  products: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateProductPayload {
  name: string;
  category?: string;
  subcategory?: string;
  features?: string[];
  benefits?: string[];
  price?: number;
  currency?: string;
  images?: string[];
  brand?: string;
  targetAudience?: string;
  tags?: string[];
}

export type UpdateProductPayload = Partial<CreateProductPayload>;
