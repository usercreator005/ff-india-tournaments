const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC INFO
    ========================= */
    name: {
      type: String,
      required: true,
      trim: true
    },

    game: {
      type: String,
      required: true,
      trim: true,
      default: "Free Fire"
    },

    // 🔒 Platform supports ONLY Squad
    mode: {
      type: String,
      enum: ["Squad"],
      default: "Squad",
      immutable: true
    },

    map: {
      type: String,
      required: true,
      trim: true
    },

    startTime: {
      type: Date,
      required: true,
      index: true
    },

    /* =========================
       SLOT CONTROL
    ========================= */
    slots: {
      type: Number,
      required: true,
      min: 1,
      max: 100 // Safety cap (can adjust later)
    },

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

    /* =========================
       PRIZE & ENTRY
    ========================= */
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

    /* =========================
       STATUS FLOW
    ========================= */
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "past", "cancelled"],
      default: "upcoming",
      index: true
    },

    /* =================================================
       🔐 PHASE 1 CORE SECURITY — ADMIN DATA BOUNDARY
    ================================================= */
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
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
   INDEXES
========================= */

tournamentSchema.index({ adminId: 1, status: 1, startTime: 1 });
tournamentSchema.index({ adminId: 1, name: 1, startTime: 1 });

/* =========================
   VIRTUALS
========================= */

tournamentSchema.virtual("slotsLeft").get(function () {
  return Math.max(this.slots - this.filledSlots, 0);
});

tournamentSchema.set("toJSON", { virtuals: true });
tournamentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Tournament", tournamentSchema);
