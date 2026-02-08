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
    },

    /* =========================
       ROUND SUPPORT (FUTURE SAFE)
       Phase 3 = Single round
       Later we can support qualifiers/finals
    ========================= */
    round: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* =========================
       VISIBILITY CONTROL
       Admin can create early but publish later
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
       SECURITY BOUNDARY
       Same isolation as Tournament
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

// Fast lookup of rooms per tournament
matchRoomSchema.index({ tournamentId: 1, round: 1 });

// One room per round per tournament (Phase 3 logic)
matchRoomSchema.index(
  { tournamentId: 1, round: 1 },
  { unique: true }
);

module.exports = mongoose.model("MatchRoom", matchRoomSchema);
