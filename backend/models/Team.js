const mongoose = require("mongoose");

/* =========================
   TEAM SCHEMA
========================= */
const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    leaderEmail: {
      type: String,
      required: true
    },

    members: {
      type: [String],
      default: []
    },

    // 🔑 INVITE CODE (CAPTAIN SHARES THIS)
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

/* =========================
   EXPORT
========================= */
module.exports = mongoose.model("Team", teamSchema);
