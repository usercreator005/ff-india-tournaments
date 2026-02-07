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

    // Tracks confirmed joins (prevents race-condition overfill later)
    filledSlots: {
      type: Number,
      default: 0,
      min: 0
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
   INDEXES
========================= */

// Faster filtering by status
tournamentSchema.index({ status: 1, createdAt: -1 });

/* =========================
   VIRTUALS
========================= */

tournamentSchema.virtual("slotsLeft").get(function () {
  return Math.max(this.slots - this.filledSlots, 0);
});

tournamentSchema.set("toJSON", { virtuals: true });
tournamentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Tournament", tournamentSchema);
