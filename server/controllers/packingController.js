const mongoose = require("mongoose");
const PackingItem = require("../models/PackingItem");
const { validateTripParticipantAccess } = require("../utils/tripAccess");

async function validateTripOwnership(tripId, userId, res) {
  return validateTripParticipantAccess(tripId, userId, res);
}

function parseQuantity(raw, required) {
  if (raw === undefined || raw === null) {
    if (required) {
      return { ok: false, message: "Please provide quantity." };
    }
    return { ok: true, value: undefined };
  }

  if (typeof raw === "string" && raw.trim() === "") {
    return {
      ok: false,
      message: "Quantity must be a whole number greater than or equal to 1.",
    };
  }

  const n = typeof raw === "number" ? raw : Number(raw);

  if (!Number.isInteger(n) || n < 1) {
    return {
      ok: false,
      message: "Quantity must be a whole number greater than or equal to 1.",
    };
  }

  return { ok: true, value: n };
}

function parsePacked(raw) {
  if (raw === undefined || raw === null) {
    return { ok: true, value: undefined };
  }
  if (typeof raw === "boolean") {
    return { ok: true, value: raw };
  }
  if (raw === "true" || raw === "false") {
    return { ok: true, value: raw === "true" };
  }
  return { ok: false, message: "packed must be a boolean." };
}

/** POST /api/trips/:tripId/packing */
async function createPackingItem(req, res, next) {
  try {
    const { tripId } = req.params;

    const access = await validateTripOwnership(tripId, req.user.id, res);
    if (!access) return;

    const { title, quantity, category, packed } = req.body;

    if (title === undefined) {
      return res.status(400).json({ message: "Please provide title." });
    }

    const titleTrim = String(title).trim();
    if (!titleTrim) {
      return res.status(400).json({ message: "Title cannot be empty." });
    }

    const q = parseQuantity(quantity, false);
    if (!q.ok) {
      return res.status(400).json({ message: q.message });
    }

    const p = parsePacked(packed);
    if (!p.ok) {
      return res.status(400).json({ message: p.message });
    }

    const item = await PackingItem.create({
      trip: tripId,
      title: titleTrim,
      quantity: q.value ?? 1,
      category:
        category !== undefined ? String(category).trim() : "",
      packed: p.value ?? false,
    });

    return res.status(201).json({
      message: "Packing item created successfully.",
      packingItem: item,
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/trips/:tripId/packing */
async function getPackingItems(req, res, next) {
  try {
    const { tripId } = req.params;

    const access = await validateTripOwnership(tripId, req.user.id, res);
    if (!access) return;

    const items = await PackingItem.find({ trip: tripId })
      .sort({ category: 1, createdAt: 1 })
      .exec();

    return res.status(200).json({
      count: items.length,
      packingItems: items,
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/trips/:tripId/packing/:packingItemId */
async function getPackingItemById(req, res, next) {
  try {
    const { tripId, packingItemId } = req.params;

    const access = await validateTripOwnership(tripId, req.user.id, res);
    if (!access) return;

    if (!mongoose.isValidObjectId(packingItemId)) {
      return res.status(400).json({ message: "Invalid packing item ID." });
    }

    const item = await PackingItem.findOne({
      _id: packingItemId,
      trip: tripId,
    }).exec();

    if (!item) {
      return res.status(404).json({ message: "Packing item not found." });
    }

    return res.status(200).json({ packingItem: item });
  } catch (err) {
    return next(err);
  }
}

/** PATCH /api/trips/:tripId/packing/:packingItemId */
async function updatePackingItem(req, res, next) {
  try {
    const { tripId, packingItemId } = req.params;

    const access = await validateTripOwnership(tripId, req.user.id, res);
    if (!access) return;

    if (!mongoose.isValidObjectId(packingItemId)) {
      return res.status(400).json({ message: "Invalid packing item ID." });
    }

    const item = await PackingItem.findOne({
      _id: packingItemId,
      trip: tripId,
    }).exec();

    if (!item) {
      return res.status(404).json({ message: "Packing item not found." });
    }

    const allowed = ["title", "quantity", "category", "packed"];
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
        item.title = nextTitle;
        continue;
      }

      if (field === "quantity") {
        const q = parseQuantity(req.body.quantity, true);
        if (!q.ok) {
          return res.status(400).json({ message: q.message });
        }
        item.quantity = q.value;
        continue;
      }

      if (field === "category") {
        item.category = String(req.body.category).trim();
        continue;
      }

      if (field === "packed") {
        const p = parsePacked(req.body.packed);
        if (!p.ok || p.value === undefined) {
          return res.status(400).json({ message: p.message || "packed must be a boolean." });
        }
        item.packed = p.value;
      }
    }

    if (!changed) {
      return res.status(400).json({
        message:
          "No valid fields to update. Allowed: title, quantity, category, packed.",
      });
    }

    await item.save();

    return res.status(200).json({
      message: "Packing item updated successfully.",
      packingItem: item,
    });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/trips/:tripId/packing/:packingItemId */
async function deletePackingItem(req, res, next) {
  try {
    const { tripId, packingItemId } = req.params;

    const access = await validateTripOwnership(tripId, req.user.id, res);
    if (!access) return;

    if (!mongoose.isValidObjectId(packingItemId)) {
      return res.status(400).json({ message: "Invalid packing item ID." });
    }

    const item = await PackingItem.findOneAndDelete({
      _id: packingItemId,
      trip: tripId,
    }).exec();

    if (!item) {
      return res.status(404).json({ message: "Packing item not found." });
    }

    return res.status(200).json({
      message: "Packing item deleted successfully.",
      packingItem: item,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createPackingItem,
  getPackingItems,
  getPackingItemById,
  updatePackingItem,
  deletePackingItem,
};
