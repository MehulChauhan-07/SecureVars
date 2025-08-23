import { Router } from "express";
import { getAllSecrets, createSecret, getRecentlyAccessed, deleteSecrets, getSecret, updateSecret, deleteSecret, toggleSecretStatus, toggleFavorite, getSecretHistory, rollbackSecret } from "../controllers/secret.controller.js";
import { protectWithAccessToken } from "../middleware/masterAuth.middleware.js";

const router = Router();

// Protect all routes after this middleware
router.use(protectWithAccessToken);

router
  .route("/")
  .get(getAllSecrets)
  .post(createSecret);

router.route("/recent").get(getRecentlyAccessed);

router.route("/bulk-delete").post(deleteSecrets);

router
  .route("/:id")
  .get(getSecret)
  .put(updateSecret)
  .delete(deleteSecret);

router.route("/:id/toggle-status").patch(toggleSecretStatus);

router.route("/:id/toggle-favorite").patch(toggleFavorite);

router.route("/:id/history").get(getSecretHistory);

router.route("/:id/rollback").post(rollbackSecret);

export default router;
