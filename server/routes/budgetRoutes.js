const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createBudget,
  getBudget,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post("/", createBudget);
router.get("/", getBudget);
router.patch("/", updateBudget);
router.delete("/", deleteBudget);

module.exports = router;
