const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true
    },

    /* =========================
       PUBLIC USERNAME
       (Shown everywhere instead of email)
    ========================= */
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },

    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
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
      default: "a1"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
