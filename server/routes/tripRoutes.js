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

const router = express.Router();

router.use(protect);

router.post("/", createTrip);
router.get("/", getTrips);

router.use("/:tripId/itinerary", itineraryRoutes);

router.get("/:id", getTripById);
router.patch("/:id", updateTrip);
router.delete("/:id", deleteTrip);

module.exports = router;
