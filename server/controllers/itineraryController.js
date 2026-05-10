const mongoose = require("mongoose");
const Itinerary = require("../models/Itinerary");
const { validateTripParticipantAccess } = require("../utils/tripAccess");

async function validateTripOwnership(tripId, userId, res) {
  return validateTripParticipantAccess(tripId, userId, res);
}

function parseStopDates(body) {
  const arrivalDate = new Date(body.arrivalDate);
  const departureDate = new Date(body.departureDate);

  const invalid =
    Number.isNaN(arrivalDate.getTime()) ||
    Number.isNaN(departureDate.getTime());

  if (invalid) {
    return {
      ok: false,
      message: "Invalid arrivalDate or departureDate.",
    };
  }

  if (departureDate < arrivalDate) {
    return {
      ok: false,
      message: "Departure date must be on or after arrival date.",
    };
  }

  return { ok: true, arrivalDate, departureDate };
}

/** POST /api/trips/:tripId/itinerary */
async function addStop(req, res, next) {
  try {
    const { tripId } = req.params;
    const ok = await validateTripOwnership(tripId, req.user.id, res);
    if (!ok) return;

    const { city, country, arrivalDate, departureDate, notes } = req.body;

    if (
      city === undefined ||
      country === undefined ||
      arrivalDate === undefined ||
      departureDate === undefined
    ) {
      return res.status(400).json({
        message: "Please provide city, country, arrivalDate, and departureDate.",
      });
    }

    const dates = parseStopDates({ arrivalDate, departureDate });
    if (!dates.ok) {
      return res.status(400).json({ message: dates.message });
    }

    const cityTrim = String(city).trim();
    const countryTrim = String(country).trim();

    if (!cityTrim || !countryTrim) {
      return res.status(400).json({
        message: "City and country cannot be empty.",
      });
    }

    const stop = await Itinerary.create({
      trip: tripId,
      city: cityTrim,
      country: countryTrim,
      arrivalDate: dates.arrivalDate,
      departureDate: dates.departureDate,
      notes: notes !== undefined ? String(notes) : "",
    });

    return res.status(201).json({
      message: "Stop added successfully.",
      stop,
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/trips/:tripId/itinerary */
async function getStops(req, res, next) {
  try {
    const { tripId } = req.params;
    const ok = await validateTripOwnership(tripId, req.user.id, res);
    if (!ok) return;

    const stops = await Itinerary.find({ trip: tripId })
      .sort({ arrivalDate: 1 })
      .exec();

    return res.status(200).json({
      count: stops.length,
      stops,
    });
  } catch (err) {
    return next(err);
  }
}

async function findStopOnOwnedTrip(stopId, tripId, userId, res) {
  if (!mongoose.isValidObjectId(stopId)) {
    res.status(400).json({ message: "Invalid stop ID." });
    return null;
  }

  const tripOk = await validateTripOwnership(tripId, userId, res);
  if (!tripOk) return null;

  const stop = await Itinerary.findOne({
    _id: stopId,
    trip: tripId,
  }).exec();

  if (!stop) {
    res.status(404).json({ message: "Stop not found." });
    return null;
  }

  return stop;
}

/** GET /api/trips/:tripId/itinerary/:stopId */
async function getStopById(req, res, next) {
  try {
    const { tripId, stopId } = req.params;

    const stop = await findStopOnOwnedTrip(
      stopId,
      tripId,
      req.user.id,
      res
    );

    if (!stop) return;

    return res.status(200).json({ stop });
  } catch (err) {
    return next(err);
  }
}

/** PATCH /api/trips/:tripId/itinerary/:stopId */
async function updateStop(req, res, next) {
  try {
    const { tripId, stopId } = req.params;

    const stop = await findStopOnOwnedTrip(
      stopId,
      tripId,
      req.user.id,
      res
    );

    if (!stop) return;

    const allowed = [
      "city",
      "country",
      "arrivalDate",
      "departureDate",
      "notes",
    ];

    let changed = false;

    for (const field of allowed) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
        continue;
      }

      changed = true;

      if (field === "city") {
        const nextCity = String(req.body.city).trim();
        if (!nextCity) {
          return res.status(400).json({ message: "City cannot be empty." });
        }
        stop.city = nextCity;
        continue;
      }

      if (field === "country") {
        const nextCountry = String(req.body.country).trim();
        if (!nextCountry) {
          return res.status(400).json({
            message: "Country cannot be empty.",
          });
        }
        stop.country = nextCountry;
        continue;
      }

      if (field === "notes") {
        stop.notes = String(req.body.notes);
        continue;
      }

      if (field === "arrivalDate") {
        const d = new Date(req.body.arrivalDate);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ message: "Invalid arrivalDate." });
        }
        stop.arrivalDate = d;
        continue;
      }

      if (field === "departureDate") {
        const d = new Date(req.body.departureDate);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({
            message: "Invalid departureDate.",
          });
        }
        stop.departureDate = d;
      }
    }

    if (!changed) {
      return res.status(400).json({
        message:
          "No valid fields to update. Allowed: city, country, arrivalDate, departureDate, notes.",
      });
    }

    if (stop.departureDate < stop.arrivalDate) {
      return res.status(400).json({
        message: "Departure date must be on or after arrival date.",
      });
    }

    await stop.save();

    return res.status(200).json({
      message: "Stop updated successfully.",
      stop,
    });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/trips/:tripId/itinerary/:stopId */
async function deleteStop(req, res, next) {
  try {
    const { tripId, stopId } = req.params;

    const tripOk = await validateTripOwnership(tripId, req.user.id, res);
    if (!tripOk) return;

    if (!mongoose.isValidObjectId(stopId)) {
      return res.status(400).json({ message: "Invalid stop ID." });
    }

    const stop = await Itinerary.findOneAndDelete({
      _id: stopId,
      trip: tripId,
    }).exec();

    if (!stop) {
      return res.status(404).json({ message: "Stop not found." });
    }

    return res.status(200).json({
      message: "Stop deleted successfully.",
      stop,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  addStop,
  getStops,
  getStopById,
  updateStop,
  deleteStop,
};
