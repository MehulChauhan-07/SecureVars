import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import logger from "../utils/logger.js";
import {
  hashPassword,
  comparePassword,
  generateSecureToken,
} from "../utils/encryption.js";

// Initialize master password
export const initializeMasterPassword = catchAsync(async (req, res, next) => {
  // Check if master password is already set
  if (process.env.MASTER_PASSWORD_HASH) {
    return next(new AppError("Master password is already set", 400));
  }

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

  if (!masterPassword || masterPassword.length < 12) {
    return next(
      new AppError("Master password must be at least 12 characters", 400)
    );
  }

  // Hash the master password
  const hashedPassword = await hashPassword(masterPassword);

  // In a real implementation, we would save this to a secure storage
  // For this demo, we'll just set it to an environment variable
  process.env.MASTER_PASSWORD_HASH = hashedPassword;

  logger.info("Master password has been initialized");

  res.status(200).json({
    status: "success",
    message: "Master password initialized successfully",
  });
});

// Authenticate with master password
export const authenticate = catchAsync(async (req, res, next) => {
  console.log("Auth request body:", req.body);

  // Safely check if req.body exists and is an object
  if (!req.body || typeof req.body !== "object") {
    return next(
      new AppError(
        "Request body must be valid JSON with masterPassword field",
        400
      )
    );
  }

  // Safe extraction without destructuring
  const masterPassword = req.body.masterPassword;

  if (!masterPassword) {
    return next(new AppError("Please provide master password", 400));
  }

  // Check if master password is set
  if (!process.env.MASTER_PASSWORD_HASH) {
    return next(
      new AppError(
        "System is not initialized. Please set up the master password first",
        400
      )
    );
  }

  // Compare the password
  const isValid = await comparePassword(
    masterPassword,
    process.env.MASTER_PASSWORD_HASH
  );

  if (!isValid) {
    logger.warn(`Failed master password attempt from IP: ${req.ip}`);
    return next(new AppError("Invalid master password", 401));
  }

  // Generate JWT token
  const token = jwt.sign(
    { isMasterUser: true, timestamp: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );

  // Generate refresh token
  const refreshToken = generateSecureToken();

  // In a real implementation, we would save the refresh token to a database
  // For this demo, we'll just use an in-memory store
  if (!global.refreshTokens) global.refreshTokens = {};

  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  global.refreshTokens[refreshToken] = {
    isMasterUser: true,
    expiresAt,
  };

  logger.info(`Master authentication successful from IP: ${req.ip}`);

  console.log("Setting token cookie with value:", token);

  // Set JWT token as an HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure in production
    maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // More permissive in development
    path: "/",
  });

  console.log("Setting refreshToken cookie with value:", refreshToken);

  // Set refresh token as an HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // More permissive in development
    path: "/",
  });

  // Send token response
  res.status(200).json({
    status: "success",
    message: "Authentication successful",
    data: {
      // Include tokens in response for clients that can't use cookies
      token,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      cookiesEnabled: true,
    },
  });
});

// Refresh token
export const refreshToken = catchAsync(async (req, res, next) => {
  // Get refresh token from cookie instead of request body
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new AppError("No refresh token found in cookies", 400));
  }

  // Check if refresh token exists and is valid
  if (!global.refreshTokens || !global.refreshTokens[refreshToken]) {
    return next(new AppError("Invalid refresh token", 401));
  }

  // Check if refresh token is expired
  const tokenData = global.refreshTokens[refreshToken];
  if (tokenData.expiresAt < Date.now()) {
    delete global.refreshTokens[refreshToken];
    return next(new AppError("Refresh token has expired", 401));
  }

  // Generate new JWT token
  const token = jwt.sign(
    { isMasterUser: tokenData.isMasterUser, timestamp: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );

  logger.info("Token refreshed successfully");

  // Set new JWT token as HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000, // 1 hour
    sameSite: "strict",
  });

  // Refresh token stays the same, but we update its expiry in the cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: "strict",
  });

  // Send token response
  res.status(200).json({
    status: "success",
    message: "Token refreshed successfully",
    data: {
      token,
      refreshToken, // Return the same refresh token
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    },
  });
});

// Logout
export const logout = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (
    refreshToken &&
    global.refreshTokens &&
    global.refreshTokens[refreshToken]
  ) {
    delete global.refreshTokens[refreshToken];
  }

  // Clear the cookies
  res.clearCookie("token");
  res.clearCookie("refreshToken");

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

// Change master password
export const changeMasterPassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(
      new AppError("Please provide both current and new password", 400)
    );
  }

  if (newPassword.length < 12) {
    return next(
      new AppError("New master password must be at least 12 characters", 400)
    );
  }

  // Check if current password is correct
  const isValid = await comparePassword(
    currentPassword,
    process.env.MASTER_PASSWORD_HASH
  );

  if (!isValid) {
    logger.warn(`Failed master password change attempt from IP: ${req.ip}`);
    return next(new AppError("Current password is incorrect", 401));
  }

  // Hash the new password
  const hashedPassword = await hashPassword(newPassword);

  // Update the master password hash
  process.env.MASTER_PASSWORD_HASH = hashedPassword;

  // Invalidate all refresh tokens
  global.refreshTokens = {};

  logger.info("Master password changed successfully");

  res.status(200).json({
    status: "success",
    message: "Master password changed successfully",
  });
});

// Check token validity
export const checkToken = catchAsync(async (req, res) => {
  // If middleware passed, token is valid

  // Get the cookies for debugging
  const cookies = {
    token: req.cookies.token
      ? `${req.cookies.token.substring(0, 10)}...`
      : "Not present",
    refreshToken: req.cookies.refreshToken ? "Present" : "Not present",
  };

  res.status(200).json({
    status: "success",
    message: "Token is valid",
    data: {
      user: req.user,
      cookies: cookies,
      authType: req.cookies.token ? "cookie" : "header",
      timestamp: new Date().toISOString(),
    },
  });
});
