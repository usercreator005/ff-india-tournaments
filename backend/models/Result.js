const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    /* =========================
       RELATIONS
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
      required: true,
      index: true,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },

    /* =========================
       MATCH PERFORMANCE DATA
    ========================= */
    position: {
      type: Number,
      required: true, // 1st, 2nd, 3rd...
    },

    kills: {
      type: Number,
      default: 0,
      min: 0,
    },

    points: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =========================
       STATUS CONTROL
    ========================= */
    isLocked: {
      type: Boolean,
      default: false, // Once locked, result can't be edited
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

// One result per team per match
resultSchema.index({ matchRoomId: 1, teamId: 1 }, { unique: true });

// Admin filtering
resultSchema.index({ adminId: 1, tournamentId: 1 });

// Leaderboard sorting
resultSchema.index({ matchRoomId: 1, points: -1 });

module.exports = mongoose.model("Result", resultSchema);
