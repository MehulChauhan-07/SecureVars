import {
  pbkdf2Sync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "crypto";
import { genSalt, hash, compare } from "bcryptjs";

// Generate encryption key from master password
const generateKey = (masterPassword, salt) => {
  return pbkdf2Sync(masterPassword, salt, 100000, 32, "sha512");
};

// Encrypt value
const encryptValue = (value, encryptionKey) => {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);

  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    iv: iv.toString("hex"),
    encrypted,
    authTag,
  };
};

// Decrypt value
const decryptValue = (encryptedData, encryptionKey) => {
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey,
      Buffer.from(encryptedData.iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(
      "Decryption failed. The data may be corrupted or the key is incorrect."
    );
  }
};

// Hash a password
const hashPassword = async (password) => {
  const salt = await genSalt(12);
  return await hash(password, salt);
};

// Compare password with hash
const comparePassword = async (password, hashedPassword) => {
  return await compare(password, hashedPassword);
};

// Generate a random secure token
const generateSecureToken = (length = 32) => {
  return randomBytes(length).toString("hex");
};

export {
  generateKey,
  encryptValue,
  decryptValue,
  hashPassword,
  comparePassword,
  generateSecureToken,
};
