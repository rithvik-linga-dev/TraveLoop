const mongoose = require("mongoose");
const Trip = require("../models/Trip");
const Note = require("../models/Note");

async function validateTripOwnership(tripId, userId, res) {
  if (!mongoose.isValidObjectId(tripId)) {
    res.status(400).json({ message: "Invalid trip ID." });
    return false;
  }

  const ok = await Trip.exists({ _id: tripId, user: userId });
  if (!ok) {
    res.status(404).json({ message: "Trip not found." });
    return false;
  }

  return true;
}

function parseDate(raw, required) {
  if (raw === undefined || raw === null) {
    if (required) {
      return { ok: false, message: "Please provide date." };
    }
    return { ok: true, value: undefined };
  }

  if (typeof raw === "string" && raw.trim() === "") {
    return { ok: false, message: "Invalid date." };
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, message: "Invalid date." };
  }

  return { ok: true, value: d };
}

/** POST /api/trips/:tripId/notes */
async function createNote(req, res, next) {
  try {
    const { tripId } = req.params;

    const access = await validateTripOwnership(tripId, req.user.id, res);
    if (!access) return;

    const { title, content, tag, date } = req.body;

    if (title === undefined) {
      return res.status(400).json({ message: "Please provide title." });
    }

    const titleTrim = String(title).trim();
    if (!titleTrim) {
      return res.status(400).json({ message: "Title cannot be empty." });
    }

    const parsedDate = parseDate(date, false);
    if (!parsedDate.ok) {
      return res.status(400).json({ message: parsedDate.message });
    }

    const note = await Note.create({
      trip: tripId,
      title: titleTrim,
      content: content !== undefined ? String(content) : "",
      tag: tag !== undefined ? String(tag).trim() : "",
      date: parsedDate.value ?? new Date(),
    });

    return res.status(201).json({
      message: "Note created successfully.",
      note,
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/trips/:tripId/notes */
async function getNotes(req, res, next) {
  try {
    const { tripId } = req.params;

    const access = await validateTripOwnership(tripId, req.user.id, res);
    if (!access) return;

    const notes = await Note.find({ trip: tripId })
      .sort({ date: -1, createdAt: -1 })
      .exec();

    return res.status(200).json({
      count: notes.length,
      notes,
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/trips/:tripId/notes/:noteId */
async function getNoteById(req, res, next) {
  try {
    const { tripId, noteId } = req.params;

    const access = await validateTripOwnership(tripId, req.user.id, res);
    if (!access) return;

    if (!mongoose.isValidObjectId(noteId)) {
      return res.status(400).json({ message: "Invalid note ID." });
    }

    const note = await Note.findOne({
      _id: noteId,
      trip: tripId,
    }).exec();

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    return res.status(200).json({ note });
  } catch (err) {
    return next(err);
  }
}

/** PATCH /api/trips/:tripId/notes/:noteId */
async function updateNote(req, res, next) {
  try {
    const { tripId, noteId } = req.params;

    const access = await validateTripOwnership(tripId, req.user.id, res);
    if (!access) return;

    if (!mongoose.isValidObjectId(noteId)) {
      return res.status(400).json({ message: "Invalid note ID." });
    }

    const note = await Note.findOne({
      _id: noteId,
      trip: tripId,
    }).exec();

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    const allowed = ["title", "content", "tag", "date"];
    let changed = false;

    for (const field of allowed) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
        continue;
      }

      changed = true;

      if (field === "title") {
        const nextTitle = String(req.body.title).trim();
        if (!nextTitle) {
          return res.status(400).json({ message: "Title cannot be empty." });
        }
        note.title = nextTitle;
        continue;
      }

      if (field === "content") {
        note.content = String(req.body.content);
        continue;
      }

      if (field === "tag") {
        note.tag = String(req.body.tag).trim();
        continue;
      }

      if (field === "date") {
        const parsed = parseDate(req.body.date, true);
        if (!parsed.ok) {
          return res.status(400).json({ message: parsed.message });
        }
        note.date = parsed.value;
      }
    }

    if (!changed) {
      return res.status(400).json({
        message:
          "No valid fields to update. Allowed: title, content, tag, date.",
      });
    }

    await note.save();

    return res.status(200).json({
      message: "Note updated successfully.",
      note,
    });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/trips/:tripId/notes/:noteId */
async function deleteNote(req, res, next) {
  try {
    const { tripId, noteId } = req.params;

    const access = await validateTripOwnership(tripId, req.user.id, res);
    if (!access) return;

    if (!mongoose.isValidObjectId(noteId)) {
      return res.status(400).json({ message: "Invalid note ID." });
    }

    const note = await Note.findOneAndDelete({
      _id: noteId,
      trip: tripId,
    }).exec();

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    return res.status(200).json({
      message: "Note deleted successfully.",
      note,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
