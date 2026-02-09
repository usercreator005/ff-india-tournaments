const mongoose = require("mongoose");

const matchRoomSchema = new mongoose.Schema(
  {
    /* =========================
       TOURNAMENT LINK
    ========================= */
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },

    /* =========================
       🏆 STAGE SYSTEM (NEW)
       Enables multi-match per stage tournaments
    ========================= */
    stageNumber: {
      type: Number,
      required: true, // Stage 1, Stage 2, Stage 3...
      min: 1,
      index: true,
    },

    matchNumber: {
      type: Number,
      required: true, // Match 1 of Stage, Match 2 of Stage...
      min: 1,
    },

    /* =========================
       ROOM DETAILS
    ========================= */
    roomId: {
      type: String,
      required: true,
      trim: true,
    },

    roomPassword: {
      type: String,
      required: true,
      trim: true,
      select: false, // 🔒 Hidden unless explicitly requested
    },

    /* =========================
       LEGACY ROUND SUPPORT
       (kept for backward compatibility)
    ========================= */
    round: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* =========================
       VISIBILITY CONTROL
    ========================= */
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    /* =========================
       ACTIVE FLAG
    ========================= */
    isActive: {
      type: Boolean,
      default: true,
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
  {
    timestamps: true,
  }
);

/* =========================
   INDEXES
========================= */

// One match per stage slot inside a tournament
matchRoomSchema.index(
  { tournamentId: 1, stageNumber: 1, matchNumber: 1 },
  { unique: true }
);

// Fast stage leaderboard lookups
matchRoomSchema.index({ tournamentId: 1, stageNumber: 1 });

// Fast lookup for visible player room
matchRoomSchema.index({ tournamentId: 1, isPublished: 1, isActive: 1 });

// Admin dashboard filtering
matchRoomSchema.index({ adminId: 1, tournamentId: 1 });

/* =========================
   MIDDLEWARE
========================= */

// Auto-set publishedAt when room is published
matchRoomSchema.pre("save", function (next) {
  if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

/* =========================
   TRANSFORM OUTPUT
   Never leak password accidentally
========================= */
matchRoomSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.roomPassword;
    return ret;
  },
});

module.exports = mongoose.model("MatchRoom", matchRoomSchema);
