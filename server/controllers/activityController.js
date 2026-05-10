const mongoose = require("mongoose");
const Trip = require("../models/Trip");
const Itinerary = require("../models/Itinerary");
const Activity = require("../models/Activity");

/**
 * Ensures the trip belongs to this user AND the itinerary stop belongs to that trip.
 * Sends the HTTP response on failure and returns false.
 */
async function validateStopOnOwnedTrip(tripId, stopId, userId, res) {
  if (!mongoose.isValidObjectId(tripId)) {
    res.status(400).json({ message: "Invalid trip ID." });
    return false;
  }

  if (!mongoose.isValidObjectId(stopId)) {
    res.status(400).json({ message: "Invalid stop ID." });
    return false;
  }

  const tripOk = await Trip.exists({ _id: tripId, user: userId });
  if (!tripOk) {
    res.status(404).json({ message: "Trip not found." });
    return false;
  }

  const stopOk = await Itinerary.exists({ _id: stopId, trip: tripId });
  if (!stopOk) {
    res.status(404).json({ message: "Stop not found." });
    return false;
  }

  return true;
}

function parseCost(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: 0 };
  }

  const n = typeof raw === "number" ? raw : Number(raw);

  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, message: "Cost must be a number greater than or equal to 0." };
  }

  return { ok: true, value: n };
}

/** POST …/activities */
async function createActivity(req, res, next) {
  try {
    const { tripId, stopId } = req.params;

    const access = await validateStopOnOwnedTrip(
      tripId,
      stopId,
      req.user.id,
      res
    );
    if (!access) return;

    const { title, description, cost, category, duration, location } =
      req.body;

    if (title === undefined) {
      return res.status(400).json({
        message: "Please provide a title.",
      });
    }

    const titleTrim = String(title).trim();
    if (!titleTrim) {
      return res.status(400).json({ message: "Title cannot be empty." });
    }

    const parsedCost = parseCost(cost);
    if (!parsedCost.ok) {
      return res.status(400).json({ message: parsedCost.message });
    }

    const activity = await Activity.create({
      stop: stopId,
      title: titleTrim,
      description:
        description !== undefined ? String(description) : undefined,
      cost: parsedCost.value,
      category:
        category !== undefined ? String(category).trim() : undefined,
      duration:
        duration !== undefined ? String(duration).trim() : undefined,
      location:
        location !== undefined ? String(location).trim() : undefined,
    });

    return res.status(201).json({
      message: "Activity added successfully.",
      activity,
    });
  } catch (err) {
    return next(err);
  }
}

/** GET …/activities */
async function getActivities(req, res, next) {
  try {
    const { tripId, stopId } = req.params;

    const access = await validateStopOnOwnedTrip(
      tripId,
      stopId,
      req.user.id,
      res
    );
    if (!access) return;

    const activities = await Activity.find({ stop: stopId })
      .sort({ createdAt: 1 })
      .exec();

    return res.status(200).json({
      count: activities.length,
      activities,
    });
  } catch (err) {
    return next(err);
  }
}

async function findActivityForStop(activityId, stopId, tripId, userId, res) {
  if (!mongoose.isValidObjectId(activityId)) {
    res.status(400).json({ message: "Invalid activity ID." });
    return null;
  }

  const access = await validateStopOnOwnedTrip(tripId, stopId, userId, res);
  if (!access) return null;

  const activity = await Activity.findOne({
    _id: activityId,
    stop: stopId,
  }).exec();

  if (!activity) {
    res.status(404).json({ message: "Activity not found." });
    return null;
  }

  return activity;
}

/** GET …/activities/:activityId */
async function getActivityById(req, res, next) {
  try {
    const { tripId, stopId, activityId } = req.params;

    const activity = await findActivityForStop(
      activityId,
      stopId,
      tripId,
      req.user.id,
      res
    );

    if (!activity) return;

    return res.status(200).json({ activity });
  } catch (err) {
    return next(err);
  }
}

/** PATCH …/activities/:activityId */
async function updateActivity(req, res, next) {
  try {
    const { tripId, stopId, activityId } = req.params;

    const activity = await findActivityForStop(
      activityId,
      stopId,
      tripId,
      req.user.id,
      res
    );

    if (!activity) return;

    const allowed = [
      "title",
      "description",
      "cost",
      "category",
      "duration",
      "location",
    ];

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
        activity.title = nextTitle;
        continue;
      }

      if (field === "description") {
        activity.description = String(req.body.description);
        continue;
      }

      if (field === "cost") {
        const parsedCost = parseCost(req.body.cost);
        if (!parsedCost.ok) {
          return res.status(400).json({ message: parsedCost.message });
        }
        activity.cost = parsedCost.value;
        continue;
      }

      if (field === "category") {
        activity.category = String(req.body.category).trim();
        continue;
      }

      if (field === "duration") {
        activity.duration = String(req.body.duration).trim();
        continue;
      }

      if (field === "location") {
        activity.location = String(req.body.location).trim();
      }
    }

    if (!changed) {
      return res.status(400).json({
        message:
          "No valid fields to update. Allowed: title, description, cost, category, duration, location.",
      });
    }

    await activity.save();

    return res.status(200).json({
      message: "Activity updated successfully.",
      activity,
    });
  } catch (err) {
    return next(err);
  }
}

/** DELETE …/activities/:activityId */
async function deleteActivity(req, res, next) {
  try {
    const { tripId, stopId, activityId } = req.params;

    const access = await validateStopOnOwnedTrip(
      tripId,
      stopId,
      req.user.id,
      res
    );
    if (!access) return;

    if (!mongoose.isValidObjectId(activityId)) {
      return res.status(400).json({ message: "Invalid activity ID." });
    }

    const activity = await Activity.findOneAndDelete({
      _id: activityId,
      stop: stopId,
    }).exec();

    if (!activity) {
      return res.status(404).json({ message: "Activity not found." });
    }

    return res.status(200).json({
      message: "Activity deleted successfully.",
      activity,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
};
