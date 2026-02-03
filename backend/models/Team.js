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

    // ✅ Captain identification (still email for auth safety)
    leaderEmail: {
      type: String,
      required: true
    },

    // ✅ Team WhatsApp Number (NEW)
    whatsapp: {
      type: String,
      required: true,
      trim: true
    },

    // ✅ Members stored as USERNAMES (NOT EMAILS)
    members: {
      type: [String], // usernames
      default: []
    },

    // 🔑 INVITE CODE
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
