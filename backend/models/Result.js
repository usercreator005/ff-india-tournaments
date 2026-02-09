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
      min: 1,
    },

    kills: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Points earned only from placement
    placementPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Points earned only from kills
    killPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Final calculated total (placement + kills)
    points: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    /* =========================
       VERIFICATION & LOCKING
    ========================= */

    isLocked: {
      type: Boolean,
      default: false, // Once locked, result can't be edited
      index: true,
    },

    lockedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null, // Admin/staff who locked the result
    },

    notes: {
      type: String,
      maxlength: 500,
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

// One result per team per match (prevents duplicates)
resultSchema.index({ matchRoomId: 1, teamId: 1 }, { unique: true });

// Admin filtering
resultSchema.index({ adminId: 1, tournamentId: 1 });

// Leaderboard sorting
resultSchema.index({ matchRoomId: 1, points: -1 });

// Fast tournament leaderboard aggregation
resultSchema.index({ tournamentId: 1, teamId: 1 });

module.exports = mongoose.model("Result", resultSchema);
