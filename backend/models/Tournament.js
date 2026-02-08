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
      min: 0,
      validate: {
        validator: function (v) {
          return v <= this.slots;
        },
        message: "Filled slots cannot exceed total slots"
      }
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
      enum: ["upcoming", "ongoing", "past", "cancelled"],
      default: "upcoming",
      index: true
    },

    // 👤 Admin who created this tournament
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
      index: true
    },

    // 🔐 Organization isolation (ties tournament to one admin’s org)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      immutable: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

/* =========================
   COMPOUND INDEXES
========================= */

// Faster filtering by org + status (Admin panel)
tournamentSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

// Prevent same admin from creating tournaments with identical name at same time
tournamentSchema.index({ createdByAdmin: 1, name: 1, createdAt: -1 });

/* =========================
   VIRTUALS
========================= */

tournamentSchema.virtual("slotsLeft").get(function () {
  return Math.max(this.slots - this.filledSlots, 0);
});

tournamentSchema.set("toJSON", { virtuals: true });
tournamentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Tournament", tournamentSchema);
