import Secret from "../models/secret.model.js";
import SecretHistory from "../models/secretHistory.model.js";
import Project from "../models/project.modal.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import logger from "../utils/logger.js";
import { parse } from "dotenv";
import { Parser } from "json2csv";

export const importFromEnv = catchAsync(async (req, res, next) => {
  const { content, project, environment } = req.body;

  if (!content) {
    return next(new AppError("Please provide content to import", 400));
  }

  if (!project) {
    return next(new AppError("Please provide a project name", 400));
  }

  if (!environment) {
    return next(new AppError("Please provide an environment", 400));
  }

  // Parse .env content
  const parsed = parse(content);
  const results = {
    success: 0,
    errors: [],
    duplicates: [],
  };

  // Find or create the project
  let projectDoc = await Project.findOne({ name: project });
  if (!projectDoc) {
    projectDoc = await Project.create({
      name: project,
      environments: [environment],
    });
  } else if (!projectDoc.environments.includes(environment)) {
    projectDoc.environments.push(environment);
    await projectDoc.save();
  }

  // Process each key-value pair
  for (const [identifier, value] of Object.entries(parsed)) {
    try {
      // Check if secret already exists for this project and identifier
      const existingSecret = await Secret.findOne({
        identifier,
        "project.name": project,
      });

      if (existingSecret) {
        results.duplicates.push(identifier);
        continue;
      }

      // Create new secret
      const secret = new Secret({
        name: identifier, // Use identifier as name by default
        identifier,
        project: {
          name: project,
          _id: projectDoc._id,
        },
        environment,
        meta: {
          description: `Imported from .env file on ${new Date().toISOString()}`,
          tags: ["imported", environment],
          version: 1,
        },
      });

      // Set the value which will be encrypted on save
      secret.setValue(value);
      await secret.save();

      // Create first history entry
      const historyEntry = new SecretHistory({
        secretId: secret._id,
        version: 1,
        changeDescription: "Imported from .env file",
      });

      historyEntry.setValue(value);
      await historyEntry.save();

      results.success += 1;
    } catch (error) {
      logger.error(`Error importing secret ${identifier}: ${error.message}`);
      results.errors.push(`${identifier}: ${error.message}`);
    }
  }

  logger.info(
    `Import completed: ${results.success} secrets imported from .env`
  );

  res.status(200).json({
    status: "success",
    data: results,
  });
});

export const importFromJson = catchAsync(async (req, res, next) => {
  const { secrets } = req.body;

  if (!secrets || !Array.isArray(secrets) || secrets.length === 0) {
    return next(
      new AppError("Please provide an array of secrets to import", 400)
    );
  }

  const results = {
    success: 0,
    errors: [],
    duplicates: [],
  };

  for (const secretData of secrets) {
    try {
      const {
        name,
        identifier,
        value,
        project: projectData,
        environment,
        meta = {},
      } = secretData;

      if (
        !name ||
        !identifier ||
        !value ||
        !projectData?.name ||
        !environment
      ) {
        results.errors.push(
          `${identifier || "Unknown"}: Missing required fields`
        );
        continue;
      }

      // Check if secret already exists for this project and identifier
      const existingSecret = await Secret.findOne({
        identifier,
        "project.name": projectData.name,
      });

      if (existingSecret) {
        results.duplicates.push(identifier);
        continue;
      }

      // Find or create the project
      let project = await Project.findOne({ name: projectData.name });
      if (!project) {
        project = await Project.create({
          name: projectData.name,
          modules: projectData.module ? [projectData.module] : [],
          environments: [environment],
        });
      } else if (!project.environments.includes(environment)) {
        project.environments.push(environment);
        await project.save();
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
          description:
            meta.description ||
            `Imported from JSON on ${new Date().toISOString()}`,
          tags: meta.tags || ["imported"],
          isActive: meta.isActive !== undefined ? meta.isActive : true,
          isFavorite: meta.isFavorite || false,
          version: 1,
        },
      });

      // Set the value which will be encrypted on save
      secret.setValue(value);
      await secret.save();

      // Create first history entry
      const historyEntry = new SecretHistory({
        secretId: secret._id,
        version: 1,
        changeDescription: "Imported from JSON",
      });

      historyEntry.setValue(value);
      await historyEntry.save();

      results.success += 1;
    } catch (error) {
      logger.error(`Error importing secret: ${error.message}`);
      results.errors.push(`Unknown: ${error.message}`);
    }
  }

  logger.info(
    `Import completed: ${results.success} secrets imported from JSON`
  );

  res.status(200).json({
    status: "success",
    data: results,
  });
});

export const exportToEnv = catchAsync(async (req, res, next) => {
  const { secretIds, environment } = req.body;

  let filter = {};

  if (secretIds && Array.isArray(secretIds) && secretIds.length > 0) {
    filter._id = { $in: secretIds };
  }

  if (environment) {
    filter.environment = environment;
  }

  const secrets = await Secret.find(filter);

  if (secrets.length === 0) {
    return next(new AppError("No secrets found to export", 404));
  }

  let envContent = `# SecureVars Export\n# Generated on ${new Date().toISOString()}\n\n`;

  for (const secret of secrets) {
    const value = secret.value;
    if (value !== null) {
      envContent += `${secret.identifier}=${value}\n`;
    }
  }

  logger.info(`Exported ${secrets.length} secrets to .env format`);

  res.status(200).json({
    status: "success",
    data: {
      format: "env",
      filename: `secrets-export-${Date.now()}.env`,
      content: envContent,
    },
  });
});

export const exportToJson = catchAsync(async (req, res, next) => {
  const { secretIds, environment } = req.body;

  let filter = {};

  if (secretIds && Array.isArray(secretIds) && secretIds.length > 0) {
    filter._id = { $in: secretIds };
  }

  if (environment) {
    filter.environment = environment;
  }

  const secrets = await Secret.find(filter);

  if (secrets.length === 0) {
    return next(new AppError("No secrets found to export", 404));
  }

  const jsonData = secrets.map((secret) => ({
    name: secret.name,
    identifier: secret.identifier,
    value: secret.value,
    project: {
      name: secret.project.name,
      module: secret.project.module,
    },
    environment: secret.environment,
    meta: {
      description: secret.meta.description,
      tags: secret.meta.tags,
      isActive: secret.meta.isActive,
      isFavorite: secret.meta.isFavorite,
    },
  }));

  logger.info(`Exported ${secrets.length} secrets to JSON format`);

  res.status(200).json({
    status: "success",
    data: {
      format: "json",
      filename: `secrets-export-${Date.now()}.json`,
      content: JSON.stringify(jsonData, null, 2),
    },
  });
});

export const exportToCsv = catchAsync(async (req, res, next) => {
  const { secretIds, environment } = req.body;

  let filter = {};

  if (secretIds && Array.isArray(secretIds) && secretIds.length > 0) {
    filter._id = { $in: secretIds };
  }

  if (environment) {
    filter.environment = environment;
  }

  const secrets = await Secret.find(filter);

  if (secrets.length === 0) {
    return next(new AppError("No secrets found to export", 404));
  }

  const fields = [
    "name",
    "identifier",
    "value",
    "project.name",
    "project.module",
    "environment",
    "meta.description",
    "meta.tags",
    "meta.isActive",
    "meta.createdAt",
    "meta.lastUpdated",
  ];

  const csvData = secrets.map((secret) => ({
    name: secret.name,
    identifier: secret.identifier,
    value: secret.value,
    "project.name": secret.project.name,
    "project.module": secret.project.module || "",
    environment: secret.environment,
    "meta.description": secret.meta.description || "",
    "meta.tags": secret.meta.tags.join(","),
    "meta.isActive": secret.meta.isActive,
    "meta.createdAt": secret.meta.createdAt.toISOString(),
    "meta.lastUpdated": secret.meta.lastUpdated.toISOString(),
  }));

  const json2csvParser = new Parser({ fields });
  const csvContent = json2csvParser.parse(csvData);

  logger.info(`Exported ${secrets.length} secrets to CSV format`);

  res.status(200).json({
    status: "success",
    data: {
      format: "csv",
      filename: `secrets-export-${Date.now()}.csv`,
      content: csvContent,
    },
  });
});
