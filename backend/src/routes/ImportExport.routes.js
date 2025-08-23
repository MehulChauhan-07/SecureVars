import { Router } from "express";
import { importFromEnv, exportToEnv, importFromJson, exportToJson, exportToCsv } from "../controllers/ImportExport.controller.js";
import { protectWithAccessToken } from "../middleware/masterAuth.middleware.js";

const router = Router();

// Protect all routes after this middleware
router.use(protectWithAccessToken);

router
  .route("/env")
  .post(importFromEnv)
  .get(exportToEnv);

router
  .route("/json")
  .post(importFromJson)
  .get(exportToJson);

router.route("/csv").get(exportToCsv);

export default router;
