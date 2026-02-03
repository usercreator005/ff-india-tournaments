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

    // 🔐 Captain auth (email)
    leaderEmail: {
      type: String,
      required: true
    },

    // 📞 Team WhatsApp number
    whatsapp: {
      type: String,
      required: true,
      trim: true
    },

    // 👥 Members (USERNAMES only)
    // Captain included
    members: {
      type: [String],
      default: []
    },

    // 🔑 Invite Code
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
