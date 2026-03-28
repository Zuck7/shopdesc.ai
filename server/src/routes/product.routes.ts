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

// POST /api/products/import/csv — must be before /:id routes
router.post("/import/csv", csvUpload.single("file"), importCsv as unknown as RequestHandler);

// POST /api/products/import/shopify — pulls from the connected Shopify store
router.post("/import/shopify", importShopify as unknown as RequestHandler);

// CRUD
router.get("/", validate(listProductsSchema), listProducts as unknown as RequestHandler);
router.post("/", validate(createProductSchema), createProduct as unknown as RequestHandler);
router.get("/:id", validate(productIdSchema), getProduct as unknown as RequestHandler);
router.put("/:id", validate(updateProductSchema), updateProduct as unknown as RequestHandler);
router.delete("/:id", validate(productIdSchema), deleteProduct as unknown as RequestHandler);

export default router;
