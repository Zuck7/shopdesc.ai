import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(500),
    category: z.string().max(100).optional(),
    subcategory: z.string().max(100).optional(),
    features: z.array(z.string()).default([]),
    benefits: z.array(z.string()).default([]),
    price: z.number().positive().optional(),
    currency: z.string().length(3).default("USD"),
    images: z.array(z.string().url()).default([]),
    brand: z.string().max(200).optional(),
    targetAudience: z.string().max(500).optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(1).max(500).optional(),
    category: z.string().max(100).optional(),
    subcategory: z.string().max(100).optional(),
    features: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    price: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    images: z.array(z.string().url()).optional(),
    brand: z.string().max(200).optional(),
    targetAudience: z.string().max(500).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(500).default(20),
    search: z.string().optional(),
    source: z.enum(["manual", "csv", "shopify"]).optional(),
    category: z.string().optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
