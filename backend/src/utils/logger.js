import {
  format as _format,
  createLogger,
  transports as _transports,
} from "winston";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log format
const logFormat = _format.combine(
  _format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  _format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`)
);

// Create logger instance
const logger = createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: logFormat,
  transports: [
    // Console output
    new _transports.Console({
      format: _format.combine(_format.colorize(), logFormat),
    }),
    // File output - error logs
    new _transports.File({
      filename: join(__dirname, "../logs/error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File output - all logs
    new _transports.File({
      filename: join(__dirname, "../logs/combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

export default logger;
