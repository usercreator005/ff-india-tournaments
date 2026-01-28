const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slots: { type: Number, required: true },
    prizePool: { type: String, required: true },

    entryType: {
      type: String,
      enum: ["free", "paid"],
      default: "free"
    },

    entryFee: { type: Number, default: 0 },

    // 🔐 Payment info (ONLY FOR PAID)
    upiId: { type: String, default: null },
    qrImage: { type: String, default: null },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "past"],
      default: "upcoming"
    },

    registrationStart: Date,
    registrationEnd: Date,
    matchStart: Date,

    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tournament", tournamentSchema);
