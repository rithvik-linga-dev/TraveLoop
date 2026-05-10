const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addStop,
  getStops,
  getStopById,
  updateStop,
  deleteStop,
} = require("../controllers/itineraryController");
const activityRoutes = require("./activityRoutes");

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post("/", addStop);
router.get("/", getStops);

router.use("/:stopId/activities", activityRoutes);

router.get("/:stopId", getStopById);
router.patch("/:stopId", updateStop);
router.delete("/:stopId", deleteStop);

module.exports = router;
