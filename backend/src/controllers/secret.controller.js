import Secret from "../models/secret.model.js";
import SecretHistory from "../models/secretHistory.model.js";
import Project from "../models/project.modal.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import logger from "../utils/logger.js";

export const getAllSecrets = catchAsync(async (req, res, next) => {
  const filter = {};

  // Filter by project name
  if (req.query.project) {
    filter["project.name"] = req.query.project;
  }

  // Filter by environment
  if (req.query.environment) {
    filter.environment = req.query.environment;
  }

  // Filter by tag
  if (req.query.tag) {
    filter["meta.tags"] = req.query.tag;
  }

  // Filter by active status
  if (req.query.active) {
    filter["meta.isActive"] = req.query.active === "true";
  }

  // Filter by favorite status
  if (req.query.favorite) {
    filter["meta.isFavorite"] = req.query.favorite === "true";
  }

  // Get secrets (without showing the actual secret values in the list)
  const secrets = await Secret.find(filter)
    .select("-encryptedValue -iv -authTag")
    .sort("-meta.lastUpdated");

  res.status(200).json({
    status: "success",
    results: secrets.length,
    data: {
      secrets,
    },
  });
});

export const getSecret = catchAsync(async (req, res, next) => {
  const secret = await Secret.findById(req.params.id);

  if (!secret) {
    return next(new AppError("No secret found with that ID", 404));
  }

  // Track this access
  await secret.trackAccess();

  // Create a response object with the decrypted value
  const secretWithValue = secret.toObject();
  secretWithValue.value = secret.value; // This uses the virtual getter

  // Remove encrypted fields from response
  delete secretWithValue.encryptedValue;
  delete secretWithValue.iv;
  delete secretWithValue.authTag;

  res.status(200).json({
    status: "success",
    data: {
      secret: secretWithValue,
    },
  });
});

export const createSecret = catchAsync(async (req, res, next) => {
  // Extract data from request body
  const {
    name,
    identifier,
    value,
    project: projectData,
    environment,
    meta,
  } = req.body;

  // Check if identifier is already used for the same project
  const isDuplicate = await Secret.isDuplicateIdentifier(
    identifier,
    projectData.name
  );
  if (isDuplicate) {
    return next(
      new AppError(
        `Secret with identifier ${identifier} already exists for project ${projectData.name}`,
        400
      )
    );
  }

  // Find or create the project
  let project = await Project.findOne({ name: projectData.name });
  if (!project) {
    project = await Project.create({
      name: projectData.name,
      modules: projectData.module ? [projectData.module] : [],
      environments: [environment],
    });
  } else {
    // Add module to project if it's not already included
    if (projectData.module && !project.modules.includes(projectData.module)) {
      project.modules.push(projectData.module);
    }

    // Add environment to project if not already included
    if (!project.environments.includes(environment)) {
      project.environments.push(environment);
      await project.save();
    }
  }

  // Create the secret
  const secret = new Secret({
    name,
    identifier,
    project: {
      name: projectData.name,
      module: projectData.module,
      _id: project._id,
    },
    environment,
    meta: {
      description: meta?.description || "",
      tags: meta?.tags || [],
      isActive: meta?.isActive !== undefined ? meta.isActive : true,
      isFavorite: meta?.isFavorite || false,
      version: 1,
      // New fields
      category: meta?.category || "",
      priority: meta?.priority || "medium",
      strength: meta?.strength || "moderate",
      rotationReminder: {
        enabled: meta?.rotationReminder?.enabled || false,
        intervalDays: meta?.rotationReminder?.intervalDays || 90,
        lastRotated: meta?.rotationReminder?.lastRotated
          ? new Date(meta.rotationReminder.lastRotated)
          : new Date(),
        nextDue: meta?.rotationReminder?.nextDue
          ? new Date(meta.rotationReminder.nextDue)
          : null,
      },
      personalNotes: meta?.personalNotes || "",
      quickCopyFormat: meta?.quickCopyFormat || "env",
      usagePattern: {
        frequency: meta?.usagePattern?.frequency || "",
        lastUsedInProject: meta?.usagePattern?.lastUsedInProject || "",
      },
    },
  });

  // Set the value which will be encrypted on save
  secret.setValue(value);
  await secret.save();

  // Create first history entry
  const historyEntry = new SecretHistory({
    secretId: secret._id,
    version: 1,
    changeDescription: "Initial creation",
  });

  historyEntry.setValue(value);
  await historyEntry.save();

  logger.info(
    `New secret created: ${identifier} for project ${projectData.name}`
  );

  // Return success but don't send back the encrypted data
  res.status(201).json({
    status: "success",
    data: {
      secret: {
        id: secret._id,
        name: secret.name,
        identifier: secret.identifier,
        project: secret.project,
        environment: secret.environment,
        meta: secret.meta,
      },
    },
  });
});

export const updateSecret = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, identifier, value, project, environment, meta } = req.body;

  // Find the secret
  const secret = await Secret.findById(id);
  if (!secret) {
    return next(new AppError("No secret found with that ID", 404));
  }

  // Check for identifier duplicates if it's changed
  if (identifier && identifier !== secret.identifier) {
    const isDuplicate = await Secret.isDuplicateIdentifier(
      identifier,
      project?.name || secret.project.name,
      id
    );
    if (isDuplicate) {
      return next(
        new AppError(
          `Secret with identifier ${identifier} already exists for project ${
            project?.name || secret.project.name
          }`,
          400
        )
      );
    }
  }

  // Update fields if provided
  if (name) secret.name = name;
  if (identifier) secret.identifier = identifier;
  if (project && project.name) {
    // Find or create the project
    let projectDoc = await Project.findOne({ name: project.name });
    if (!projectDoc) {
      projectDoc = await Project.create({
        name: project.name,
        modules: project.module ? [project.module] : [],
        environments: [environment || secret.environment],
      });
    }

    secret.project = {
      name: project.name,
      module: project.module,
      _id: projectDoc._id,
    };
  }
  if (environment) secret.environment = environment;

  // Update meta fields
  // In updateSecret controller
  // Update meta fields
  if (meta) {
    if (meta.description !== undefined)
      secret.meta.description = meta.description;
    if (meta.tags) secret.meta.tags = meta.tags;
    if (meta.isActive !== undefined) secret.meta.isActive = meta.isActive;
    if (meta.isFavorite !== undefined) secret.meta.isFavorite = meta.isFavorite;

    // New fields
    if (meta.category !== undefined) secret.meta.category = meta.category;
    if (meta.priority !== undefined) secret.meta.priority = meta.priority;
    if (meta.strength !== undefined) secret.meta.strength = meta.strength;

    // Handle rotationReminder object
    if (meta.rotationReminder) {
      secret.meta.rotationReminder = secret.meta.rotationReminder || {};
      if (meta.rotationReminder.enabled !== undefined)
        secret.meta.rotationReminder.enabled = meta.rotationReminder.enabled;
      if (meta.rotationReminder.intervalDays !== undefined)
        secret.meta.rotationReminder.intervalDays =
          meta.rotationReminder.intervalDays;
      if (meta.rotationReminder.lastRotated !== undefined)
        secret.meta.rotationReminder.lastRotated = new Date(
          meta.rotationReminder.lastRotated
        );
      if (meta.rotationReminder.nextDue !== undefined)
        secret.meta.rotationReminder.nextDue = new Date(
          meta.rotationReminder.nextDue
        );
    }

    if (meta.personalNotes !== undefined)
      secret.meta.personalNotes = meta.personalNotes;
    if (meta.quickCopyFormat !== undefined)
      secret.meta.quickCopyFormat = meta.quickCopyFormat;

    // Handle usagePattern object
    if (meta.usagePattern) {
      secret.meta.usagePattern = secret.meta.usagePattern || {};
      if (meta.usagePattern.frequency !== undefined)
        secret.meta.usagePattern.frequency = meta.usagePattern.frequency;
      if (meta.usagePattern.lastUsedInProject !== undefined)
        secret.meta.usagePattern.lastUsedInProject =
          meta.usagePattern.lastUsedInProject;
    }
  }

  // If value is provided, update it and create history entry
  if (value) {
    const oldValue = secret.value;
    const newVersion = secret.meta.version + 1;

    // Only create history if value actually changed
    if (value !== oldValue) {
      secret.meta.version = newVersion;
      secret.setValue(value);

      // Create history entry after saving secret
      const historyPromise = SecretHistory.create({
        secretId: secret._id,
        version: newVersion,
        changeDescription: `Updated by ${
          req.user?.isMasterUser ? "master user" : "system"
        } on ${new Date().toISOString()}`,
      });

      // Set the value which will be encrypted on save
      historyPromise.then((history) => {
        history.setValue(value);
        return history.save();
      });
    }
  }

  // Update timestamp
  secret.meta.lastUpdated = Date.now();

  await secret.save();

  logger.info(
    `Secret updated: ${secret.identifier} for project ${secret.project.name}`
  );

  // Return success but don't send back the encrypted data
  res.status(200).json({
    status: "success",
    data: {
      secret: {
        id: secret._id,
        name: secret.name,
        identifier: secret.identifier,
        project: secret.project,
        environment: secret.environment,
        meta: secret.meta,
      },
    },
  });
});

export const deleteSecret = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const secret = await Secret.findByIdAndDelete(id);

  if (!secret) {
    return next(new AppError("No secret found with that ID", 404));
  }

  // Delete all history entries for this secret
  await SecretHistory.deleteMany({ secretId: id });

  logger.info(
    `Secret deleted: ${secret.identifier} for project ${secret.project.name}`
  );

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const deleteSecrets = catchAsync(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(
      new AppError("Please provide an array of secret IDs to delete", 400)
    );
  }

  // Delete all the specified secrets
  const result = await Secret.deleteMany({ _id: { $in: ids } });

  // Delete all history entries for these secrets
  await SecretHistory.deleteMany({ secretId: { $in: ids } });

  logger.info(`Bulk delete: ${result.deletedCount} secrets removed`);

  res.status(200).json({
    status: "success",
    message: `${result.deletedCount} secrets successfully deleted`,
  });
});

export const toggleSecretStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const secret = await Secret.findById(id);

  if (!secret) {
    return next(new AppError("No secret found with that ID", 404));
  }

  secret.meta.isActive = !secret.meta.isActive;
  secret.meta.lastUpdated = Date.now();
  await secret.save();

  logger.info(
    `Secret status toggled to ${
      secret.meta.isActive ? "active" : "inactive"
    }: ${secret.identifier}`
  );

  res.status(200).json({
    status: "success",
    data: {
      isActive: secret.meta.isActive,
    },
  });
});

export const toggleFavorite = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const secret = await Secret.findById(id);

  if (!secret) {
    return next(new AppError("No secret found with that ID", 404));
  }

  secret.meta.isFavorite = !secret.meta.isFavorite;
  await secret.save();

  res.status(200).json({
    status: "success",
    data: {
      isFavorite: secret.meta.isFavorite,
    },
  });
});

export const getSecretHistory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const secret = await Secret.findById(id);

  if (!secret) {
    return next(new AppError("No secret found with that ID", 404));
  }

  const history = await SecretHistory.find({ secretId: id })
    .select("-encryptedValue -iv -authTag")
    .sort("-version");

  res.status(200).json({
    status: "success",
    data: {
      secret: {
        id: secret._id,
        name: secret.name,
        identifier: secret.identifier,
      },
      history,
    },
  });
});

export const rollbackSecret = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { version } = req.body;

  if (!version) {
    return next(new AppError("Please provide a version to roll back to", 400));
  }

  const secret = await Secret.findById(id);

  if (!secret) {
    return next(new AppError("No secret found with that ID", 404));
  }

  // Find the history entry for the specified version
  const historyEntry = await SecretHistory.findOne({
    secretId: id,
    version: parseInt(version, 10),
  });

  if (!historyEntry) {
    return next(new AppError(`No history found for version ${version}`, 404));
  }

  // Get the value from the history entry
  const historyValue = historyEntry.value;

  // Update the current secret with the historical value
  const newVersion = secret.meta.version + 1;
  secret.setValue(historyValue);
  secret.meta.version = newVersion;
  secret.meta.lastUpdated = Date.now();
  await secret.save();

  // Create a new history entry for this rollback
  const newHistory = new SecretHistory({
    secretId: id,
    version: newVersion,
    changeDescription: `Rolled back to version ${version}`,
  });

  newHistory.setValue(historyValue);
  await newHistory.save();

  logger.info(`Secret rolled back: ${secret.identifier} to version ${version}`);

  res.status(200).json({
    status: "success",
    data: {
      message: `Successfully rolled back to version ${version}`,
      newVersion,
    },
  });
});

export const getRecentlyAccessed = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 5;

  const secrets = await Secret.find({ "meta.lastAccessed": { $exists: true } })
    .sort("-meta.lastAccessed")
    .limit(limit)
    .select("-encryptedValue -iv -authTag");

  res.status(200).json({
    status: "success",
    results: secrets.length,
    data: {
      secrets,
    },
  });
});
