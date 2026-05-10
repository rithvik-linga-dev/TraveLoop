const mongoose = require("mongoose");
const Trip = require("../models/Trip");

function tripParticipantFilter(userId) {
  return {
    $or: [{ owner: userId }, { collaborators: userId }],
  };
}

function tripParticipantQuery(tripId, userId) {
  return {
    _id: tripId,
    ...tripParticipantFilter(userId),
  };
}

async function tripExistsForParticipant(tripId, userId) {
  return Trip.exists(tripParticipantQuery(tripId, userId));
}

/**
 * Trip owner or collaborator. Sends 400/404 on failure.
 */
async function validateTripParticipantAccess(tripId, userId, res) {
  if (!mongoose.isValidObjectId(tripId)) {
    res.status(400).json({ message: "Invalid trip ID." });
    return false;
  }

  const ok = await tripExistsForParticipant(tripId, userId);
  if (!ok) {
    res.status(404).json({ message: "Trip not found." });
    return false;
  }

  return true;
}

/**
 * Trip owner only. Sends 400/404 on failure.
 */
async function validateTripOwnerAccess(tripId, userId, res) {
  if (!mongoose.isValidObjectId(tripId)) {
    res.status(400).json({ message: "Invalid trip ID." });
    return false;
  }

  const ok = await Trip.exists({ _id: tripId, owner: userId });
  if (!ok) {
    res.status(404).json({ message: "Trip not found." });
    return false;
  }

  return true;
}

module.exports = {
  tripParticipantFilter,
  tripParticipantQuery,
  tripExistsForParticipant,
  validateTripParticipantAccess,
  validateTripOwnerAccess,
};
