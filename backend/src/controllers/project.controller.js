import Project from "../models/project.modal.js";
import Secret from "../models/secret.model.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find();

  res.status(200).json({
    status: "success",
    results: projects.length,
    data: {
      projects,
    },
  });
});

export const getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError("No project found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      project,
    },
  });
});

export const createProject = catchAsync(async (req, res, next) => {
  const { name, description, modules, environments } = req.body;

  const existingProject = await Project.findOne({ name });

  if (existingProject) {
    return next(new AppError(`Project with name ${name} already exists`, 400));
  }

  const project = await Project.create({
    name,
    description,
    modules,
    environments,
  });

  res.status(201).json({
    status: "success",
    data: {
      project,
    },
  });
});

export const updateProject = catchAsync(async (req, res, next) => {
  const { name, description, modules, environments } = req.body;

  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError("No project found with that ID", 404));
  }

  // If name is changing, check for duplicates
  if (name && name !== project.name) {
    const existingProject = await Project.findOne({ name });

    if (existingProject) {
      return next(
        new AppError(`Project with name ${name} already exists`, 400)
      );
    }
  }

  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  if (modules) project.modules = modules;
  if (environments) project.environments = environments;

  project.updatedAt = Date.now();

  await project.save();

  // If project name changed, update all references in secrets
  if (name && name !== project.name) {
    await Secret.updateMany(
      { "project._id": project._id },
      { $set: { "project.name": name } }
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      project,
    },
  });
});

export const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError("No project found with that ID", 404));
  }

  // Check if there are any secrets associated with this project
  const secretCount = await Secret.countDocuments({
    "project._id": project._id,
  });

  if (secretCount > 0) {
    return next(
      new AppError(
        `Cannot delete project with ${secretCount} secrets. Delete the secrets first.`,
        400
      )
    );
  }

  await Project.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const getProjectSecrets = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError("No project found with that ID", 404));
  }

  const secrets = await Secret.find({ "project._id": project._id }).select(
    "-encryptedValue -iv -authTag"
  );

  res.status(200).json({
    status: "success",
    results: secrets.length,
    data: {
      project,
      secrets,
    },
  });
});
