import { Router } from "express";
import { initializeMasterPassword, authenticate, refreshToken, logout, checkToken, changeMasterPassword } from "../controllers/auth.controller.js";
import { verifyMasterPassword, protectWithAccessToken } from "../middleware/masterAuth.middleware.js";
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

router.route("/initialize").post(initializeMasterPassword);

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
