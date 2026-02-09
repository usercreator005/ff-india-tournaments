const mongoose = require("mongoose");

const tournamentScoringSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      unique: true,
      index: true,
    },

    /* Placement points by position */
    placementPoints: {
      type: Map,
      of: Number,
      default: {}, // e.g. { "1": 15, "2": 12, "3": 10 }
    },

    /* Kill point multiplier */
    killPointValue: {
      type: Number,
      default: 1, // 1 kill = 1 point
      min: 0,
    },

    /* 🔐 Admin Data Boundary */
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

module.exports = mongoose.model("TournamentScoring", tournamentScoringSchema);
