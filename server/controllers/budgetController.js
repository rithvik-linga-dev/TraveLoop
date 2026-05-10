const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Activity = require("../models/Activity");
const { validateTripParticipantAccess } = require("../utils/tripAccess");

async function validateTripOwnership(tripId, userId, res) {
  return validateTripParticipantAccess(tripId, userId, res);
}

function parseNonNegativeNumber(raw, label) {
  if (raw === undefined || raw === null) {
    return { ok: true, value: undefined };
  }

  if (typeof raw === "string" && raw.trim() === "") {
    return {
      ok: false,
      message: `${label} must be a number greater than or equal to 0.`,
    };
  }

  const n = typeof raw === "number" ? raw : Number(raw);

  if (!Number.isFinite(n) || n < 0) {
    return {
      ok: false,
      message: `${label} must be a number greater than or equal to 0.`,
    };
  }

  return { ok: true, value: n };
}

/**
 * Sums Activity.cost for all activities whose stop belongs to this trip's itinerary.
 */
async function sumActivityCostForTrip(tripId) {
  const tripOid = new mongoose.Types.ObjectId(tripId);

  const result = await Activity.aggregate([
    {
      $lookup: {
        from: "itineraries",
        localField: "stop",
        foreignField: "_id",
        as: "stopLeg",
      },
    },
    { $unwind: "$stopLeg" },
    {
      $match: {
        "stopLeg.trip": tripOid,
      },
    },
    {
      $group: {
        _id: null,
        activityCost: { $sum: "$cost" },
      },
    },
  ]).exec();

  return result[0]?.activityCost ?? 0;
}

function totalsForBudget(budget, activityCost) {
  const transportCost = Number(budget.transportCost) || 0;
  const stayCost = Number(budget.stayCost) || 0;
  const foodCost = Number(budget.foodCost) || 0;
  const miscellaneousCost = Number(budget.miscellaneousCost) || 0;

  const totalCost =
    transportCost +
    stayCost +
    foodCost +
    miscellaneousCost +
    activityCost;

  return {
    activityCost,
    totalCost,
  };
}

function budgetWithComputed(budgetLean, activityCost) {
  const { activityCost: ac, totalCost } = totalsForBudget(budgetLean, activityCost);

  return {
    ...budgetLean,
    activityCost: ac,
    totalCost,
  };
}

/** POST /api/trips/:tripId/budget */
async function createBudget(req, res, next) {
  try {
    const { tripId } = req.params;

    const ok = await validateTripOwnership(tripId, req.user.id, res);
    if (!ok) return;

    const existing = await Budget.findOne({ trip: tripId }).exec();
    if (existing) {
      return res.status(409).json({
        message: "A budget already exists for this trip. Use update instead.",
      });
    }

    const {
      transportCost,
      stayCost,
      foodCost,
      miscellaneousCost,
    } = req.body;

    const t = parseNonNegativeNumber(transportCost, "transportCost");
    const s = parseNonNegativeNumber(stayCost, "stayCost");
    const f = parseNonNegativeNumber(foodCost, "foodCost");
    const m = parseNonNegativeNumber(miscellaneousCost, "miscellaneousCost");

    for (const parsed of [t, s, f, m]) {
      if (!parsed.ok) {
        return res.status(400).json({ message: parsed.message });
      }
    }

    const budget = await Budget.create({
      trip: tripId,
      transportCost: t.value ?? 0,
      stayCost: s.value ?? 0,
      foodCost: f.value ?? 0,
      miscellaneousCost: m.value ?? 0,
    });

    const activityCost = await sumActivityCostForTrip(tripId);

    return res.status(201).json({
      message: "Budget created successfully.",
      budget: budgetWithComputed(budget.toObject(), activityCost),
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        message: "A budget already exists for this trip.",
      });
    }
    return next(err);
  }
}

/** GET /api/trips/:tripId/budget */
async function getBudget(req, res, next) {
  try {
    const { tripId } = req.params;

    const ok = await validateTripOwnership(tripId, req.user.id, res);
    if (!ok) return;

    const budget = await Budget.findOne({ trip: tripId }).lean().exec();

    if (!budget) {
      return res.status(404).json({ message: "Budget not found." });
    }

    const activityCost = await sumActivityCostForTrip(tripId);

    return res.status(200).json({
      budget: budgetWithComputed(budget, activityCost),
    });
  } catch (err) {
    return next(err);
  }
}

/** PATCH /api/trips/:tripId/budget */
async function updateBudget(req, res, next) {
  try {
    const { tripId } = req.params;

    const ok = await validateTripOwnership(tripId, req.user.id, res);
    if (!ok) return;

    const budget = await Budget.findOne({ trip: tripId }).exec();
    if (!budget) {
      return res.status(404).json({ message: "Budget not found." });
    }

    const allowed = [
      "transportCost",
      "stayCost",
      "foodCost",
      "miscellaneousCost",
    ];

    let changed = false;

    for (const field of allowed) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
        continue;
      }

      changed = true;
      const parsed = parseNonNegativeNumber(req.body[field], field);
      if (!parsed.ok) {
        return res.status(400).json({ message: parsed.message });
      }
      budget[field] = parsed.value;
    }

    if (!changed) {
      return res.status(400).json({
        message:
          "No valid fields to update. Allowed: transportCost, stayCost, foodCost, miscellaneousCost.",
      });
    }

    await budget.save();

    const activityCost = await sumActivityCostForTrip(tripId);

    return res.status(200).json({
      message: "Budget updated successfully.",
      budget: budgetWithComputed(budget.toObject(), activityCost),
    });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/trips/:tripId/budget */
async function deleteBudget(req, res, next) {
  try {
    const { tripId } = req.params;

    const ok = await validateTripOwnership(tripId, req.user.id, res);
    if (!ok) return;

    const budget = await Budget.findOneAndDelete({ trip: tripId }).exec();

    if (!budget) {
      return res.status(404).json({ message: "Budget not found." });
    }

    const activityCost = await sumActivityCostForTrip(tripId);

    return res.status(200).json({
      message: "Budget deleted successfully.",
      budget: budgetWithComputed(budget.toObject(), activityCost),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createBudget,
  getBudget,
  updateBudget,
  deleteBudget,
};
