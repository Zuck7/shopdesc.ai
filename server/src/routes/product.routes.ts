import { Router, type RequestHandler } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  listProductsSchema,
  createProductSchema,
  updateProductSchema,
  productIdSchema,
} from "../validators/product.validator.js";
import {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  importCsv,
  importShopify,
} from "../controllers/product.controller.js";

const router = Router();

// All product routes require auth
router.use(authMiddleware as unknown as RequestHandler);

// CSV upload — memory storage, 5 MB limit, CSV only
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

/**
 * @swagger
 * /products/import/csv:
 *   post:
 *     summary: Import products from a CSV file
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Import results with imported/skipped/errors counts }
 */
router.post("/import/csv", csvUpload.single("file"), importCsv as unknown as RequestHandler);

/**
 * @swagger
 * /products/import/shopify:
 *   post:
 *     summary: Import products from connected Shopify store
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Import results with total/imported/updated counts }
 */
router.post("/import/shopify", importShopify as unknown as RequestHandler);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products (paginated)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: source
 *         schema: { type: string, enum: [manual, csv, shopify] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200: { description: Products list with pagination }
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               category: { type: string }
 *               brand: { type: string }
 *               price: { type: number }
 *               currency: { type: string }
 *               features: { type: array, items: { type: string } }
 *               images: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Created product, content: { application/json: { schema: { $ref: '#/components/schemas/Product' } } } }
 */
router.get("/", validate(listProductsSchema), listProducts as unknown as RequestHandler);
router.post("/", validate(createProductSchema), createProduct as unknown as RequestHandler);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product details }
 *       404: { description: Product not found }
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Product' }
 *     responses:
 *       200: { description: Updated product }
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product deleted }
 */
router.get("/:id", validate(productIdSchema), getProduct as unknown as RequestHandler);
router.put("/:id", validate(updateProductSchema), updateProduct as unknown as RequestHandler);
router.delete("/:id", validate(productIdSchema), deleteProduct as unknown as RequestHandler);

export default router;
