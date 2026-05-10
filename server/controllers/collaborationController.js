const mongoose = require("mongoose");
const Trip = require("../models/Trip");
const User = require("../models/User");
const {
  validateTripParticipantAccess,
  tripParticipantQuery,
} = require("../utils/tripAccess");

function sameUserId(a, b) {
  return String(a) === String(b);
}

function parseInvitee(body) {
  const { userId, email } = body;

  const hasUserId =
    userId !== undefined &&
    userId !== null &&
    !(typeof userId === "string" && userId.trim() === "");
  const hasEmail =
    email !== undefined &&
    email !== null &&
    !(typeof email === "string" && email.trim() === "");

  if (hasUserId && hasEmail) {
    return {
      ok: false,
      message: "Provide either userId or email, not both.",
    };
  }

  if (!hasUserId && !hasEmail) {
    return {
      ok: false,
      message: "Please provide userId or email to invite.",
    };
  }

  if (hasUserId) {
    if (!mongoose.isValidObjectId(userId)) {
      return { ok: false, message: "Invalid user ID." };
    }
    return { ok: true, userId: String(userId) };
  }

  return { ok: true, email: String(email).trim().toLowerCase() };
}

/** GET /api/trips/:tripId/collaborators */
async function getCollaborators(req, res, next) {
  try {
    const { tripId } = req.params;

    const access = await validateTripParticipantAccess(
      tripId,
      req.user.id,
      res
    );
    if (!access) return;

    const trip = await Trip.findOne(tripParticipantQuery(tripId, req.user.id))
      .populate("owner", "name email")
      .populate("collaborators", "name email")
      .exec();

    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    return res.status(200).json({
      owner: trip.owner,
      collaborators: trip.collaborators,
    });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/trips/:tripId/collaborators — owner only */
async function inviteCollaborator(req, res, next) {
  try {
    const { tripId } = req.params;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip ID." });
    }

    const parsed = parseInvitee(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ message: parsed.message });
    }

    let invitee;

    if (parsed.userId) {
      invitee = await User.findById(parsed.userId)
        .select("name email")
        .exec();
    } else {
      invitee = await User.findOne({ email: parsed.email })
        .select("name email")
        .exec();
    }

    if (!invitee) {
      return res.status(404).json({ message: "User not found." });
    }

    const inviteeId = invitee._id.toString();

    if (sameUserId(inviteeId, req.user.id)) {
      return res.status(400).json({
        message: "You are already the trip owner.",
      });
    }

    const trip = await Trip.findOne({
      _id: tripId,
      owner: req.user.id,
    }).exec();

    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    const already = trip.collaborators.some((cid) => sameUserId(cid, inviteeId));

    if (already) {
      return res.status(409).json({
        message: "This user is already a collaborator.",
      });
    }

    trip.collaborators.push(invitee._id);
    await trip.save();

    return res.status(201).json({
      message: "Collaborator invited successfully.",
      collaborator: invitee,
      trip,
    });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/trips/:tripId/collaborators/:collaboratorId — owner only */
async function removeCollaborator(req, res, next) {
  try {
    const { tripId, collaboratorId } = req.params;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip ID." });
    }

    if (!mongoose.isValidObjectId(collaboratorId)) {
      return res.status(400).json({ message: "Invalid collaborator ID." });
    }

    if (sameUserId(collaboratorId, req.user.id)) {
      return res.status(400).json({
        message: "You cannot remove yourself as owner from collaborators.",
      });
    }

    const trip = await Trip.findOne({
      _id: tripId,
      owner: req.user.id,
    }).exec();

    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    const wasMember = trip.collaborators.some((cid) =>
      sameUserId(cid, collaboratorId)
    );

    if (!wasMember) {
      return res.status(404).json({ message: "Collaborator not found." });
    }

    trip.collaborators = trip.collaborators.filter(
      (cid) => !sameUserId(cid, collaboratorId)
    );

    await trip.save();

    return res.status(200).json({
      message: "Collaborator removed successfully.",
      trip,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
};
