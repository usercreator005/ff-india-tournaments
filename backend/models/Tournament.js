const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    slots: {
      type: Number,
      required: true
    },

    prizePool: {
      type: String,
      required: true
    },

    entryType: {
      type: String,
      enum: ["free", "paid"],
      default: "free"
    },

    entryFee: {
      type: Number,
      default: 0
    },

    // 🔐 Tournament lifecycle
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "past"],
      default: "upcoming"
    },

    // 🕒 NEW: Registration & Match Timing
    registrationStart: {
      type: Date,
      required: false
    },

    registrationEnd: {
      type: Date,
      required: false
    },

    matchStart: {
      type: Date,
      required: false
    },

    // 👤 Admin email
    createdBy: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tournament", tournamentSchema);
