const mongoose = require("mongoose");

const stageResultSchema = new mongoose.Schema(
  {
    /* =========================
       TOURNAMENT & STAGE INFO
    ========================= */
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },

    stageNumber: {
      type: Number,
      required: true, // Stage 1, Stage 2, Finals etc
      min: 1,
      index: true,
    },

    /* =========================
       TEAM INFO
    ========================= */
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },

    /* =========================
       AGGREGATED PERFORMANCE
       (Across multiple matches in this stage)
    ========================= */
    matchesPlayed: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalKills: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPlacementPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalKillPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    /* =========================
       LEADERBOARD META
    ========================= */
    rank: {
      type: Number, // Calculated after sorting
      index: true,
    },

    lastMatchRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MatchRoom",
    },

    /* =========================
       QUALIFICATION FLAG
    ========================= */
    qualified: {
      type: Boolean,
      default: false,
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
   INDEXES
========================= */

// One stage result per team per stage per tournament
stageResultSchema.index(
  { tournamentId: 1, stageNumber: 1, teamId: 1 },
  { unique: true }
);

// Fast leaderboard sorting
stageResultSchema.index({ tournamentId: 1, stageNumber: 1, totalPoints: -1, totalKills: -1 });

// Admin filtering
stageResultSchema.index({ adminId: 1, tournamentId: 1, stageNumber: 1 });

module.exports = mongoose.model("StageResult", stageResultSchema);
