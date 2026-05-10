const mongoose = require("mongoose");
const Trip = require("../models/Trip");
const { tripParticipantQuery } = require("../utils/tripAccess");

/** Returns true if the string cannot be used as a MongoDB ObjectId */
function isInvalidObjectId(id) {
  return !mongoose.isValidObjectId(id);
}

/**
 * Finds a trip the user can access as owner or collaborator.
 */
async function findTripAccessibleByUser(tripId, userId) {
  return Trip.findOne(tripParticipantQuery(tripId, userId)).exec();
}

async function createTrip(req, res, next) {
  try {
    const { title, description, startDate, endDate, coverImage } = req.body;

    if (!title || startDate === undefined || endDate === undefined) {
      return res.status(400).json({
        message: "Please provide title, startDate, and endDate.",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid startDate or endDate.",
      });
    }

    if (end < start) {
      return res.status(400).json({
        message: "End date must be on or after the start date.",
      });
    }

    const trimmedTitle = String(title).trim();
    if (!trimmedTitle) {
      return res.status(400).json({
        message: "Title cannot be empty.",
      });
    }

    const trip = await Trip.create({
      title: trimmedTitle,
      description: description !== undefined ? String(description) : undefined,
      startDate: start,
      endDate: end,
      coverImage: coverImage !== undefined ? String(coverImage) : undefined,
      owner: req.user.id,
      collaborators: [],
    });

    return res.status(201).json({
      message: "Trip created successfully.",
      trip,
    });
  } catch (err) {
    return next(err);
  }
}

/** List trips the user owns or collaborates on (newest first) */
async function getTrips(req, res, next) {
  try {
    const trips = await Trip.find({
      $or: [{ owner: req.user.id }, { collaborators: req.user.id }],
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: trips.length,
      trips,
    });
  } catch (err) {
    return next(err);
  }
}

/** Get one trip — owner or collaborator */
async function getTripById(req, res, next) {
  try {
    const { id } = req.params;

    if (isInvalidObjectId(id)) {
      return res.status(400).json({ message: "Invalid trip ID." });
    }

    const trip = await findTripAccessibleByUser(id, req.user.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    return res.status(200).json({ trip });
  } catch (err) {
    return next(err);
  }
}

/**
 * Partial update — owner or collaborator.
 * `owner` / `collaborators` in the body are ignored.
 */
async function updateTrip(req, res, next) {
  try {
    const { id } = req.params;

    if (isInvalidObjectId(id)) {
      return res.status(400).json({ message: "Invalid trip ID." });
    }

    const allowedFields = [
      "title",
      "description",
      "startDate",
      "endDate",
      "coverImage",
    ];

    const trip = await findTripAccessibleByUser(id, req.user.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    let hasChanges = false;

    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
        continue;
      }

      hasChanges = true;

      if (field === "title") {
        const nextTitle = String(req.body.title).trim();
        if (!nextTitle) {
          return res.status(400).json({ message: "Title cannot be empty." });
        }
        trip.title = nextTitle;
        continue;
      }

      if (field === "description") {
        trip.description = String(req.body.description);
        continue;
      }

      if (field === "coverImage") {
        trip.coverImage = String(req.body.coverImage);
        continue;
      }

      if (field === "startDate") {
        const d = new Date(req.body.startDate);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ message: "Invalid startDate." });
        }
        trip.startDate = d;
        continue;
      }

      if (field === "endDate") {
        const d = new Date(req.body.endDate);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ message: "Invalid endDate." });
        }
        trip.endDate = d;
      }
    }

    if (!hasChanges) {
      return res.status(400).json({
        message:
          "No valid fields to update. Allowed: title, description, startDate, endDate, coverImage.",
      });
    }

    if (trip.endDate < trip.startDate) {
      return res.status(400).json({
        message: "End date must be on or after the start date.",
      });
    }

    await trip.save();

    return res.status(200).json({
      message: "Trip updated successfully.",
      trip,
    });
  } catch (err) {
    return next(err);
  }
}

/** Delete trip — owner only */
async function deleteTrip(req, res, next) {
  try {
    const { id } = req.params;

    if (isInvalidObjectId(id)) {
      return res.status(400).json({ message: "Invalid trip ID." });
    }

    const trip = await Trip.findOneAndDelete({
      _id: id,
      owner: req.user.id,
    }).exec();

    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    return res.status(200).json({
      message: "Trip deleted successfully.",
      trip,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
};
