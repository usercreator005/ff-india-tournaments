const mongoose = require("mongoose");

const hotSlotSchema = new mongoose.Schema(
  {
    /* =========================
       OPTIONAL TOURNAMENT LINK
    ========================= */
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: false, // External / off-platform tournaments allowed
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
      default: "Promotional Hot Slot",
      minlength: 5,
    },

    prizePool: {
      type: Number,
      required: true,
      min: 0,
    },

    stage: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    slots: {
      type: Number,
      required: true,
      min: 1,
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
      index: true,
      immutable: true,
    },

    /* =========================
       ANALYTICS (READ-ONLY)
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
       EXPIRY SYSTEM (AUTO – 1 DAY)
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
   INDEXES (PERFORMANCE SAFE)
========================= */
hotSlotSchema.index({ createdBy: 1, createdAt: -1 });
hotSlotSchema.index({ expiresAt: 1 });
hotSlotSchema.index({ views: -1 });

module.exports = mongoose.model("HotSlot", hotSlotSchema);
