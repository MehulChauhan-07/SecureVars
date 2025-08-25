import "dotenv/config";
import app from "../server.js";
import connectDB from "../src/config/db.config.js";
import logger from "../src/utils/logger.js";

// Connect to MongoDB
connectDB();

// Define port
const PORT = process.env.PORT || 4000;

// Start server
app.listen(PORT, () => {
  logger.info(`SecureVars server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`Current time: ${new Date().toISOString()}`);
  logger.info("Server initialized by: MehulChauhan-22");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});
