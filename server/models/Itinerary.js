const mongoose = require("mongoose");

const itinerarySchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    arrivalDate: {
      type: Date,
      required: true,
    },

    departureDate: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

itinerarySchema.index({ trip: 1, arrivalDate: 1 });

module.exports = mongoose.model("Itinerary", itinerarySchema);
