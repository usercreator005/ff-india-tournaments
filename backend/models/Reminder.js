const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    /* =========================
       RELATION LINKS
    ========================= */
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },

    matchRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MatchRoom",
      default: null,
      index: true,
    },

    /* =========================
       REMINDER TYPE
    ========================= */
    type: {
      type: String,
      enum: ["match_starting", "room_published"],
      required: true,
      index: true,
    },

    /* =========================
       SCHEDULING
    ========================= */
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },

    /* =========================
       DELIVERY STATUS
    ========================= */
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      index: true,
    },

    /* =========================
       🔐 ADMIN DATA BOUNDARY
    ========================= */
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* =========================
   INDEXES (PERFORMANCE)
========================= */

// Fast scheduler lookup
reminderSchema.index({ status: 1, scheduledFor: 1 });

// Admin dashboard filtering
reminderSchema.index({ adminId: 1, type: 1 });

module.exports = mongoose.model("Reminder", reminderSchema);
