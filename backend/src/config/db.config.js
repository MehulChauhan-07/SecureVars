import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { decryptValue } from "../utils/encryption.js";

const connectDB = async () => {
  try {
    // Decrypt MongoDB URI if it's encrypted in the .env file
    let uri = process.env.MONGODB_URI;

    if (
      process.env.ENCRYPT_ENV === "true" &&
      process.env.MONGODB_URI_ENCRYPTED
    ) {
      try {
        uri = decryptValue(
          {
            encrypted: process.env.MONGODB_URI_ENCRYPTED,
            iv: process.env.MONGODB_URI_IV,
            authTag: process.env.MONGODB_URI_AUTH_TAG,
          },
          Buffer.from(process.env.ENCRYPTION_KEY, "hex")
        );
      } catch (err) {
        logger.error("Failed to decrypt MongoDB URI. Using plaintext URI.");
      }
    }

    const conn = await mongoose.connect(uri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
