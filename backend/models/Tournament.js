const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    /* =====================
       BASIC INFO
    ===================== */
    name: {
      type: String,
      required: true,
      trim: true
    },

    slots: {
      type: Number,
      required: true,
      min: 1
    },

    prizePool: {
      type: String,
      required: true,
      trim: true
    },

    /* =====================
       ENTRY & PAYMENT
    ===================== */
    entryType: {
      type: String,
      enum: ["free", "paid"],
      default: "free"
    },

    entryFee: {
      type: Number,
      default: 0,
      min: 0
    },

    // 🔐 Payment info (PAID tournaments only)
    upiId: {
      type: String,
      default: null
    },

    qrImage: {
      type: String,
      default: null
    },

    /* =====================
       JOIN SYSTEM
    ===================== */
    players: {
      type: [String], // user emails
      default: [],
      index: true
    },

    /* =====================
       STATUS & META
    ===================== */
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "past"],
      default: "upcoming",
      index: true
    },

    createdBy: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Tournament", tournamentSchema);
