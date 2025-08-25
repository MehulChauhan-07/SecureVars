import { Router } from "express";
import {
  initializeMasterPassword,
  authenticate,
  refreshToken,
  logout,
  checkToken,
  changeMasterPassword,
  getInitializationStatus,
} from "../controllers/auth.controller.js";
import AppError from "../utils/appError.js";
import logger from "../utils/logger.js";
import {
  verifyMasterPassword,
  protectWithAccessToken,
} from "../middleware/masterAuth.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  message:
    "Too many authentication attempts. Please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// Block initialize route if already initialized
const blockIfInitialized = (req, res, next) => {
  if (process.env.MASTER_PASSWORD_HASH) {
    return next(new AppError("System already initialized", 400));
  }
  next();
};

// Public routes
router.route("/status").get(getInitializationStatus);
router.route("/initialize").post(blockIfInitialized, initializeMasterPassword);

router.route("/login").post(authLimiter, authenticate);

router.route("/refresh").post(refreshToken);

router.route("/logout").post(logout);

// Protected routes
router.use(protectWithAccessToken);

router.route("/check").get(checkToken);

router
  .route("/change-password")
  .post(verifyMasterPassword, changeMasterPassword);

export default router;
