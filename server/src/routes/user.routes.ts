import { Router, type RequestHandler } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getProfile,
  updateProfile,
  updateBrandVoice,
  getAnalytics,
} from "../controllers/user.controller.js";

const router = Router();

router.use(authMiddleware as unknown as RequestHandler);

router.get("/profile", getProfile as unknown as RequestHandler);
router.put("/profile", updateProfile as unknown as RequestHandler);
router.put("/brand-voice", updateBrandVoice as unknown as RequestHandler);
router.get("/analytics", getAnalytics as unknown as RequestHandler);

export default router;
