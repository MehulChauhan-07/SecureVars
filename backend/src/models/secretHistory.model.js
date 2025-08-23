import { Schema, model } from "mongoose";
import { encryptValue, decryptValue } from "../utils/encryption.js";

const SecretHistorySchema = new Schema({
  secretId: {
    type: Schema.Types.ObjectId,
    ref: "Secret",
    required: true,
  },
  version: {
    type: Number,
    required: true,
  },
  encryptedValue: {
    type: String,
    required: true,
  },
  iv: {
    type: String,
    required: true,
  },
  authTag: {
    type: String,
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  changeDescription: String,
});

// Create compound index for secretId and version
SecretHistorySchema.index({ secretId: 1, version: 1 }, { unique: true });

// Virtual for decrypted value
SecretHistorySchema.virtual("value").get(function () {
  try {
    if (!this.encryptedValue || !this.iv || !this.authTag) return null;

    const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    return decryptValue(
      {
        encrypted: this.encryptedValue,
        iv: this.iv,
        authTag: this.authTag,
      },
      encryptionKey
    );
  } catch (error) {
    return null; // Return null if decryption fails
  }
});

// Encrypt before validation to satisfy required encrypted field validators
SecretHistorySchema.pre("validate", function (next) {
  if (this._value === undefined) return next();
  try {
    const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    const encryptedData = encryptValue(this._value, encryptionKey);
    this.encryptedValue = encryptedData.encrypted;
    this.iv = encryptedData.iv;
    this.authTag = encryptedData.authTag;
    this._value = undefined;
    next();
  } catch (error) {
    next(error);
  }
});

// Set value through a custom setter
SecretHistorySchema.methods.setValue = function (value) {
  this._value = value;
};

const SecretHistory = model("SecretHistory", SecretHistorySchema);

export default SecretHistory;
