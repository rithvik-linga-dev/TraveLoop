const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require("../controllers/tripController");
const itineraryRoutes = require("./itineraryRoutes");
const budgetRoutes = require("./budgetRoutes");
const packingRoutes = require("./packingRoutes");

const router = express.Router();

router.use(protect);

router.post("/", createTrip);
router.get("/", getTrips);

router.use("/:tripId/itinerary", itineraryRoutes);
router.use("/:tripId/budget", budgetRoutes);
router.use("/:tripId/packing", packingRoutes);

router.get("/:id", getTripById);
router.patch("/:id", updateTrip);
router.delete("/:id", deleteTrip);

module.exports = router;
