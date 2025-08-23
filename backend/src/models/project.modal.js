import { Schema, model } from "mongoose";

const ProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "A project must have a name"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    modules: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    environments: {
      type: [String],
      enum: ["development", "production", "testing", "staging"],
      default: ["development"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate to get all secrets for this project
ProjectSchema.virtual("secrets", {
  ref: "Secret",
  localField: "_id",
  foreignField: "project._id",
});

// Update the updatedAt timestamp before save
ProjectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Project = model("Project", ProjectSchema);

export default Project;
