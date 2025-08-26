import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "./src/utils/logger.js";

// Import routes
import secretRoutes from "./src/routes/secret.routes.js";
import importExportRoutes from "./src/routes/ImportExport.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import projectRoutes from "./src/routes/project.routes.js";

// Create express app
const app = express();

// Enable CORS with credentials support for cookies
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"], // Add your frontend URL(s)
    credentials: true, // This is important for cookies
    exposedHeaders: ["set-cookie"],
  })
);

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100, // limit each IP to 100 requests per windowMs
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Parse cookies
app.use(cookieParser());

// Debug middleware to log request bodies
app.use((req, res, next) => {
  // Only log POST/PUT/PATCH requests to avoid excessive logging
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    console.log(
      `[DEBUG] ${req.method} ${req.path} - Content-Type: ${req.get(
        "Content-Type"
      )}`
    );
    console.log(`[DEBUG] Request body: ${JSON.stringify(req.body)}`);
  }
  next();
});

// Import the MongoDB safety check utility
import containsOperators from "./src/utils/mongoSafetyCheck.js";

// Custom protection against NoSQL query injection (instead of mongoSanitize)
app.use((req, res, next) => {
  // Instead of modifying the objects, check if they contain MongoDB operators
  // and return an error if they do

  if (containsOperators(req.body)) {
    return next(new Error("MongoDB operator detected in request body"));
  }

  if (containsOperators(req.params)) {
    return next(new Error("MongoDB operator detected in request parameters"));
  }

  if (containsOperators(req.query)) {
    return next(new Error("MongoDB operator detected in query string"));
  }

  // Continue if no MongoDB operators were found
  next();
});

// Import custom XSS protection
import { containsXSS, getCleanRequestData } from "./src/utils/xssProtection.js";

// Data sanitization against XSS - detect but don't modify
app.use((req, res, next) => {
  // Check for potential XSS attacks
  if (
    containsXSS(req.body) ||
    containsXSS(req.query) ||
    containsXSS(req.params)
  ) {
    return next(new Error("Potential XSS attack detected"));
  }

  // Provide clean data access method
  req.getCleanData = () => getCleanRequestData(req);

  next();
});

// Compression
app.use(compression());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Pass sanitizedQuery to query if it exists (middleware to handle Express 5 read-only query)
app.use((req, res, next) => {
  if (req.sanitizedQuery) {
    // For route handlers that expect sanitized queries
    req.getSanitizedQuery = () => req.sanitizedQuery;
  }
  next();
});

// Routes
app.get("/api", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the SecureVars API",
  });
});
app.use("/api/secrets", secretRoutes);
app.use("/api/import-export", importExportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "SecureVars API is running",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});
console.log("All routes initialized");

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  logger.error(`ERROR: ${err.message}`);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export default app;
