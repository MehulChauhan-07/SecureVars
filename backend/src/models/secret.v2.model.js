// Improved Secret model (v2) aligning with frontend mock + robust versioning/encryption
import { Schema, model, Types } from "mongoose";
import { encryptValue, decryptValue } from "../utils/encryption.js";

const ALLOWED_ENVS = ["development", "staging", "testing", "production"];

const SecretV2Schema = new Schema(
  {
    project: {
      type: Types.ObjectId,
      ref: "ProjectV2",
      required: true,
      index: true,
    },
    projectName: { type: String, required: true, trim: true }, // denormalized for faster listing
    module: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    identifier: { type: String, required: true, trim: true },
    environment: {
      type: String,
      enum: ALLOWED_ENVS,
      required: true,
      index: true,
    },
    description: { type: String },
    tags: [{ type: String, index: true }],
    isActive: { type: Boolean, default: true, index: true },
    isFavorite: { type: Boolean, default: false, index: true },
    // Encrypted payload pieces
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    // Access + lifecycle
    lastAccessed: { type: Date },
    accessCount: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    rotatedAt: { type: Date },
    deletedAt: { type: Date, index: true },
  },
  { timestamps: true, versionKey: false }
);

// Unique constraint per project + env + identifier
SecretV2Schema.index(
  { project: 1, environment: 1, identifier: 1 },
  { unique: true }
);
SecretV2Schema.index({ tags: 1, project: 1 });

// Internal flags
SecretV2Schema.methods.setValue = function (plain) {
  this._plainValue = plain;
  this._shouldEncrypt = true;
};

SecretV2Schema.methods.getValue = function () {
  try {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    return decryptValue(
      { encrypted: this.ciphertext, iv: this.iv, authTag: this.authTag },
      key
    );
  } catch {
    return null;
  }
};

SecretV2Schema.methods.trackAccess = async function () {
  this.lastAccessed = new Date();
  this.accessCount += 1;
  await this.save({ validateBeforeSave: false });
};

SecretV2Schema.pre("save", async function (next) {
  if (this._shouldEncrypt) {
    try {
      const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
      const enc = encryptValue(this._plainValue, key);
      const valueChanged =
        this.isModified("ciphertext") ||
        this.isNew ||
        this.ciphertext !== enc.encrypted;
      this.ciphertext = enc.encrypted;
      this.iv = enc.iv;
      this.authTag = enc.authTag;
      if (!this.isNew && valueChanged) {
        this.version += 1;
        this.rotatedAt = new Date();
        // Defer history creation after save (post hook) to avoid cyclic import
        this._createHistory = true;
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

SecretV2Schema.post("save", async function (doc) {
  if (doc._createHistory) {
    const { SecretHistoryV2 } = await import("./secretHistory.v2.model.js");
    try {
      await SecretHistoryV2.create({
        secret: doc._id,
        version: doc.version,
        ciphertext: doc.ciphertext,
        iv: doc.iv,
        authTag: doc.authTag,
        changedAt: doc.rotatedAt,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to create secret history entry (v2):", e.message);
    }
  }
});

export const SecretV2 = model("SecretV2", SecretV2Schema);
