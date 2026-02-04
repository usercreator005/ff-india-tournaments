const mongoose = require("mongoose");

/**
 * ============================
 * HOT SLOT SCHEMA (C5 FINAL)
 * ============================
 * ✔ External tournament friendly
 * ✔ Frontend-safe (no invalid value)
 * ✔ 24 hour auto-expiry support
 */

const hotSlotSchema = new mongoose.Schema(
  {
    /* =========================
       TOURNAMENT INFO (TEXT)
       External / Any Platform
    ========================= */
    tournamentName: {
      type: String,
      trim: true,
      default: "External Tournament",
      minlength: 3,
      index: true,
    },

    /* =========================
       BASIC INFO
    ========================= */
    title: {
      type: String,
      trim: true,
      default: "External Tournament",
      minlength: 3,
    },

    description: {
      type: String,
      trim: true,
      required: true,
      minlength: 5,
    },

    /* =========================
       PRIZE POOL (TEXT)
       e.g. ₹5,000 / Free Entry
    ========================= */
    prizePool: {
      type: String,
      trim: true,
      default: "0",
      minlength: 1,
    },

    stage: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    /* =========================
       SLOT DETAILS (TEXT)
       Room ID / Time / Rules
    ========================= */
    slots: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    /* =========================
       CREATOR META (LOCKED)
    ========================= */
    createdBy: {
      type: String, // creator gmail
      required: true,
      immutable: true,
      index: true,
    },

    /* =========================
       ANALYTICS
    ========================= */
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    whatsappClicks: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =========================
       EXPIRY SYSTEM (C5)
       Auto handled by logic
    ========================= */
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =========================
   INDEXES (NO DUPLICATES)
========================= */
hotSlotSchema.index({ createdBy: 1, createdAt: -1 });
hotSlotSchema.index({ views: -1 });

module.exports = mongoose.model("HotSlot", hotSlotSchema);
