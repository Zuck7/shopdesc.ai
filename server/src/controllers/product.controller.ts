import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import Product from "../models/Product.js";
import { logger } from "../utils/logger.js";
import { parseCsv, type CsvProduct } from "../services/csv.service.js";
import { fetchAllProducts, mapShopifyProduct } from "../services/shopify.service.js";

// GET /api/products
export const listProducts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { page = 1, limit = 20, search, source, category } = req.query as {
      page?: number;
      limit?: number;
      search?: string;
      source?: string;
      category?: string;
    };

    const filter: Record<string, unknown> = { userId };
    if (source) filter.source = source;
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
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
    const userId = req.user!._id;
    const product = await Product.create({ ...req.body, userId, source: "manual" });
    res.status(201).json(product);
  } catch (error) {
    logger.error("createProduct error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/products/:id
export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    }).lean();

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
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();

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
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
    });

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
      userId: req.user!._id,
      source: "csv" as const,
    }));

    const inserted = await Product.insertMany(docs, { ordered: false });

    res.status(201).json({
      imported: inserted.length,
      skipped: rows.length - inserted.length,
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

    // Upsert all products — match on (userId, externalId, source) so
    // re-running the sync updates existing records instead of duplicating them.
    const ops = rawProducts.map((raw) => {
      const data = mapShopifyProduct(raw);
      return {
        updateOne: {
          filter: {
            userId: user._id,
            externalId: data.externalId,
            source: "shopify" as const,
          },
          update: { $set: { ...data, userId: user._id, source: "shopify" as const } },
          upsert: true,
        },
      };
    });

    const result = await Product.bulkWrite(ops);

    res.json({
      total: rawProducts.length,
      imported: result.upsertedCount,
      updated: result.modifiedCount,
      shop: user.shopifyDomain,
    });
  } catch (error) {
    logger.error("importShopify error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
