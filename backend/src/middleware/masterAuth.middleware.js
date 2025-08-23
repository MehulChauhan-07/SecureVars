import jwt from "jsonwebtoken";
import { comparePassword } from "../utils/encryption.js";
import AppError from "../utils/appError.js";
import logger from "../utils/logger.js";

// Master password verification
export const verifyMasterPassword = async (req, res, next) => {
  try {
    console.log("MasterAuth middleware received body:", req.body);

    // Safely check if req.body exists and is an object
    if (!req.body || typeof req.body !== "object") {
      return next(
        new AppError(
          "Request body must be valid JSON with masterPassword field",
          400
        )
      );
    }

    const masterPassword = req.body.masterPassword;

    if (!masterPassword) {
      return next(new AppError("Master password is required", 401));
    }

    // Compare with stored hash
    const isValid = await comparePassword(
      masterPassword,
      process.env.MASTER_PASSWORD_HASH
    );

    if (!isValid) {
      logger.warn(`Failed master password attempt from IP: ${req.ip}`);
      return next(new AppError("Invalid master password", 401));
    }

    logger.info(`Master authentication successful from IP: ${req.ip}`);
    next();
  } catch (error) {
    next(new AppError("Authentication failed", 500));
  }
};

// Generate access token after master authentication
export const generateAccessToken = (req, res, next) => {
  try {
    const token = jwt.sign(
      {
        isMasterUser: true,
        timestamp: Date.now(),
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    req.accessToken = token;
    next();
  } catch (error) {
    next(new AppError("Failed to generate access token", 500));
  }
};

// Verify access token for protected routes
export const protectWithAccessToken = async (req, res, next) => {
  try {
    // Detailed debugging for request details
    console.log("==== AUTH DEBUG ====");
    console.log("Request path:", req.path);
    console.log("Request method:", req.method);
    console.log("Request cookies:", req.cookies);
    console.log("Request headers:", {
      authorization: req.headers.authorization,
      "content-type": req.headers["content-type"],
      cookie: req.headers.cookie,
    });

    // Get token from cookies (primary method)
    let token = req.cookies?.token;

    // Fallback to header if token isn't in cookies (for API clients that don't support cookies)
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log(
        "Bearer token found in header:",
        token.substring(0, 10) + "..."
      );
    }

    if (!token) {
      console.error("No authorization token provided in cookies or headers");
      return next(
        new AppError("You are not logged in. Please log in to get access.", 401)
      );
    }

    console.log("Token found:", token);

    // Verify token
    console.log(
      "About to verify token with JWT_SECRET:",
      process.env.JWT_SECRET ? "Secret exists" : "Secret missing!"
    );
    let decoded;
    try {
      // Check if JWT_SECRET is set properly
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not defined in environment variables!");
        return next(
          new AppError("Server configuration error: Missing JWT_SECRET", 500)
        );
      }

      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token verified successfully:", decoded);

      if (!decoded || !decoded.isMasterUser) {
        console.error("Token decoded but not a master user token:", decoded);
        return next(
          new AppError("Invalid access token - not a master user", 401)
        );
      }

      console.log("Valid master user authentication");

      // Grant access - moved inside try block to ensure decoded is defined
      req.user = decoded;
      next();
      return; // End execution here on success
    } catch (tokenError) {
      console.error("Token verification failed:", tokenError);
      console.error("Token verification error name:", tokenError.name);
      console.error("Token verification error message:", tokenError.message);
      return next(
        new AppError(`Token verification failed: ${tokenError.message}`, 401)
      );
    }
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      // Clear the invalid token cookie
      res.clearCookie("token");
      return next(new AppError("Invalid token. Please log in again", 401));
    }
    if (error.name === "TokenExpiredError") {
      // Clear the expired token cookie
      res.clearCookie("token");

      // Attempt to use refresh token if available
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        // Redirect to refresh token endpoint
        return res.status(401).json({
          status: "error",
          message: "Token expired. Use refresh token to get a new one.",
          code: "TOKEN_EXPIRED",
        });
      }

      return next(
        new AppError("Your token has expired. Please log in again", 401)
      );
    }
    console.error("General authentication error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    next(new AppError(`Authentication failed: ${error.message}`, 500));
  }
};

// Rate limiting for authentication attempts
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  message:
    "Too many authentication attempts. Please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
};
