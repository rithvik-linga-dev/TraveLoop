const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createPackingItem,
  getPackingItems,
  getPackingItemById,
  updatePackingItem,
  deletePackingItem,
} = require("../controllers/packingController");

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post("/", createPackingItem);
router.get("/", getPackingItems);
router.get("/:packingItemId", getPackingItemById);
router.patch("/:packingItemId", updatePackingItem);
router.delete("/:packingItemId", deletePackingItem);

module.exports = router;
