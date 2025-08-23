import { Schema, model } from "mongoose";
import { encryptValue, decryptValue } from "../utils/encryption.js";

const SecretSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "A secret must have a name"],
      trim: true,
    },
    identifier: {
      type: String,
      required: [true, "A secret must have an identifier"],
      trim: true,
      index: true,
    },
    encryptedValue: {
      type: String,
      required: [true, "A secret must have a value"],
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
    project: {
      name: {
        type: String,
        required: [true, "A secret must belong to a project"],
      },
      module: String,
      _id: {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
    },
    environment: {
      type: String,
      enum: ["development", "production", "testing", "staging"],
      required: [true, "A secret must have an environment"],
    },
    meta: {
      description: String,
      tags: [String],
      createdAt: {
        type: Date,
        default: Date.now,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      isFavorite: {
        type: Boolean,
        default: false,
      },
      lastAccessed: Date,
      accessCount: {
        type: Number,
        default: 0,
      },
      version: {
        type: Number,
        default: 1,
      },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create compound index for project and identifier
SecretSchema.index({ "project.name": 1, identifier: 1 }, { unique: true });

// Virtual for decrypted value (not stored in DB)
SecretSchema.virtual("value").get(function () {
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

// Middleware to encrypt value before saving
SecretSchema.pre("save", function (next) {
  if (!this.isModified("value")) return next();

  try {
    const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    const encryptedData = encryptValue(this._value, encryptionKey);

    this.encryptedValue = encryptedData.encrypted;
    this.iv = encryptedData.iv;
    this.authTag = encryptedData.authTag;

    // Update lastUpdated timestamp
    this.meta.lastUpdated = Date.now();

    next();
  } catch (error) {
    next(error);
  }
});

// Set value through a custom setter
SecretSchema.methods.setValue = function (value) {
  this._value = value;
};

// Access tracking method
SecretSchema.methods.trackAccess = function () {
  this.meta.lastAccessed = Date.now();
  this.meta.accessCount += 1;
  return this.save();
};

// Check if identifier is duplicate within the same project
SecretSchema.statics.isDuplicateIdentifier = async function (
  identifier,
  projectName,
  excludeId
) {
  const query = {
    identifier,
    "project.name": projectName,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const count = await this.countDocuments(query);
  return count > 0;
};

const Secret = model("Secret", SecretSchema);

export default Secret;
