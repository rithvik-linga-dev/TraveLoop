const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
} = require("../controllers/collaborationController");

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get("/", getCollaborators);
router.post("/", inviteCollaborator);
router.delete("/:collaboratorId", removeCollaborator);

module.exports = router;
