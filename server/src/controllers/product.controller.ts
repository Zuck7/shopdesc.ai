import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { eq, and, ilike, sql, desc } from "drizzle-orm";
import { db } from "../config/db.js";
import { products, type Source } from "../models/schema.js";
import { logger } from "../utils/logger.js";
import { parseCsv, type CsvProduct } from "../services/csv.service.js";
import { fetchAllProducts, mapShopifyProduct } from "../services/shopify.service.js";

// GET /api/products
export const listProducts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, search, source, category } = req.query as {
      page?: number;
      limit?: number;
      search?: string;
      source?: string;
      category?: string;
    };

    const conditions = [eq(products.userId, userId)];
    if (source) conditions.push(eq(products.source, source as Source));
    if (category) conditions.push(eq(products.category, category));
    if (search) conditions.push(ilike(products.name, `%${search}%`));

    const where = and(...conditions);
    const skip = (Number(page) - 1) * Number(limit);

    const [rows, [countRow]] = await Promise.all([
      db
        .select()
        .from(products)
        .where(where)
        .orderBy(desc(products.createdAt))
        .offset(skip)
        .limit(Number(limit)),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(products)
        .where(where),
    ]);

    const total = countRow?.total ?? 0;

    res.json({
      products: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error("listProducts error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/products
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [product] = await db
      .insert(products)
      .values({ ...req.body, userId, source: "manual" })
      .returning();
    res.status(201).json(product);
  } catch (error) {
    logger.error("createProduct error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/products/:id
export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, req.params.id as string), eq(products.userId, req.user!.id)))
      .limit(1);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(product);
  } catch (error) {
    logger.error("getProduct error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const [product] = await db
      .update(products)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(products.id, req.params.id as string), eq(products.userId, req.user!.id)))
      .returning();

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(product);
  } catch (error) {
    logger.error("updateProduct error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const [product] = await db
      .delete(products)
      .where(and(eq(products.id, req.params.id as string), eq(products.userId, req.user!.id)))
      .returning({ id: products.id });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json({ message: "Product deleted" });
  } catch (error) {
    logger.error("deleteProduct error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/products/import/csv
export const importCsv = async (
  req: AuthRequest & { file?: Express.Multer.File },
  res: Response
) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const { rows, errors } = parseCsv(req.file.buffer.toString("utf-8"));

    if (errors.length > 0 && rows.length === 0) {
      res.status(400).json({ message: "CSV parsing failed", errors });
      return;
    }

    const docs = rows.map((row: CsvProduct) => ({
      ...row,
      userId: req.user!.id,
      source: "csv" as const,
      price: row.price != null ? String(row.price) : null,
    }));

    let inserted = 0;
    if (docs.length > 0) {
      const result = await db.insert(products).values(docs).returning({ id: products.id });
      inserted = result.length;
    }

    res.status(201).json({
      imported: inserted,
      skipped: rows.length - inserted,
      errors,
    });
  } catch (error) {
    logger.error("importCsv error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/products/import/shopify
export const importShopify = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    if (!user.shopifyDomain || !user.shopifyAccessToken) {
      res.status(400).json({
        message:
          "Shopify store not connected. Connect your store via Settings → Shopify first.",
      });
      return;
    }

    const rawProducts = await fetchAllProducts(user.shopifyDomain, user.shopifyAccessToken);

    if (rawProducts.length === 0) {
      res.json({ total: 0, imported: 0, updated: 0, shop: user.shopifyDomain });
      return;
    }

    let importedCount = 0;
    let updatedCount = 0;

    for (const raw of rawProducts) {
      const data = mapShopifyProduct(raw);

      // Check if product already exists (upsert logic)
      const [existing] = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.userId, user.id),
            eq(products.externalId, data.externalId!),
            eq(products.source, "shopify")
          )
        )
        .limit(1);

      const priceStr = data.price != null ? String(data.price) : null;

      if (existing) {
        await db
          .update(products)
          .set({ ...data, price: priceStr, userId: user.id, source: "shopify" as const, updatedAt: new Date() })
          .where(eq(products.id, existing.id));
        updatedCount++;
      } else {
        await db
          .insert(products)
          .values({ ...data, price: priceStr, userId: user.id, source: "shopify" as const });
        importedCount++;
      }
    }

    res.json({
      total: rawProducts.length,
      imported: importedCount,
      updated: updatedCount,
      shop: user.shopifyDomain,
    });
  } catch (error) {
    logger.error("importShopify error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
