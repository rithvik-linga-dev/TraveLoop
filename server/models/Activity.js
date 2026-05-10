const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    stop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Itinerary",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    cost: {
      type: Number,
      default: 0,
      min: 0,
    },

    category: {
      type: String,
      default: "general",
      trim: true,
    },

    duration: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ stop: 1, createdAt: 1 });

module.exports = mongoose.model("Activity", activitySchema);
