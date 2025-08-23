import { Router } from "express";
import { getAllProjects, createProject, getProject, updateProject, deleteProject, getProjectSecrets } from "../controllers/project.controller.js";
import { protectWithAccessToken } from "../middleware/masterAuth.middleware.js";

const router = Router();

// Protect all routes after this middleware
router.use(protectWithAccessToken);

router
  .route("/")
  .get(getAllProjects)
  .post(createProject);

router
  .route("/:id")
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.route("/:id/secrets").get(getProjectSecrets);

export default router;
