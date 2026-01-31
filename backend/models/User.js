const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      unique: true,
      required: true
    },

    role: {
      type: String,
      default: "user"
    },

    teamId: {
      type: String,
      default: null
    },

    /* =========================
       AVATAR (FIXED PICK)
       Values: a1 → a10
    ========================= */
    avatar: {
      type: String,
      default: "a1" // default avatar
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
