const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      unique: true,
    },

    transportCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    stayCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    foodCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    miscellaneousCost: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Budget", budgetSchema);
