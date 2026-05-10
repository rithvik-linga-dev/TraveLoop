const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post("/", createNote);
router.get("/", getNotes);
router.get("/:noteId", getNoteById);
router.patch("/:noteId", updateNote);
router.delete("/:noteId", deleteNote);

module.exports = router;
