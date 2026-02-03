const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
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

    /* =========================
       PAYMENT (PAID ONLY)
    ========================= */
    upiId: {
      type: String,
      default: null,
      trim: true
    },

    qrImage: {
      type: String,
      default: null
    },

    /* =========================
       JOIN SYSTEM
    ========================= */
    players: {
      type: [String], // user emails
      default: [],
      validate: {
        validator: function (arr) {
          // prevent duplicate joins
          return arr.length === new Set(arr).size;
        },
        message: "Duplicate players not allowed"
      }
    },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "past"],
      default: "upcoming"
    },

    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

/* =========================
   VIRTUALS
========================= */

// remaining slots (read-only)
tournamentSchema.virtual("slotsLeft").get(function () {
  return Math.max(this.slots - this.players.length, 0);
});

// ensure virtuals appear in JSON
tournamentSchema.set("toJSON", { virtuals: true });
tournamentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Tournament", tournamentSchema);
