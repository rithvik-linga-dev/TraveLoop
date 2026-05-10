const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
} = require("../controllers/activityController");

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post("/", createActivity);
router.get("/", getActivities);
router.get("/:activityId", getActivityById);
router.patch("/:activityId", updateActivity);
router.delete("/:activityId", deleteActivity);

module.exports = router;
