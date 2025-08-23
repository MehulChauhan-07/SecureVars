// New Project model (v2) focusing on environments & module taxonomy
import { Schema, model } from "mongoose";

const ProjectV2Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: String,
    modules: [{ type: String, trim: true }],
    environments: {
      type: [
        {
          type: String,
          enum: ["development", "staging", "testing", "production"],
        },
      ],
      default: ["development"],
    },
    tags: [{ type: String, index: true }],
    deletedAt: { type: Date, index: true },
  },
  { timestamps: true, versionKey: false }
);

ProjectV2Schema.pre("validate", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$|/g, "")
      .toLowerCase();
  }
  next();
});

export const ProjectV2 = model("ProjectV2", ProjectV2Schema);
