// Versioned history for SecretV2
import { Schema, model, Types } from "mongoose";
import { decryptValue } from "../utils/encryption.js";

const SecretHistoryV2Schema = new Schema(
  {
    secret: {
      type: Types.ObjectId,
      ref: "SecretV2",
      required: true,
      index: true,
    },
    version: { type: Number, required: true },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changeReason: String,
  },
  { versionKey: false }
);

SecretHistoryV2Schema.index({ secret: 1, version: 1 }, { unique: true });

SecretHistoryV2Schema.methods.getValue = function () {
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

export const SecretHistoryV2 = model("SecretHistoryV2", SecretHistoryV2Schema);
