const express = require("express");
const router = express.Router();

const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");

/* =========================
   GET CURRENT USER PROFILE
   (Avatar fetch for UI)
========================= */
router.get("/me", apiLimiter, auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select(
      "name email role avatar uid"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});

/* =========================
   UPDATE AVATAR (USER)
========================= */
router.patch("/avatar", apiLimiter, auth, async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({
        success: false,
        msg: "Only users can update avatar"
      });
    }

    const { avatar } = req.body;

    // Allowed avatars a1 → a10
    const allowedAvatars = [
      "a1", "a2", "a3", "a4", "a5",
      "a6", "a7", "a8", "a9", "a10"
    ];

    if (!allowedAvatars.includes(avatar)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid avatar selection"
      });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    user.avatar = avatar;
    await user.save();

    res.json({
      success: true,
      msg: "Avatar updated successfully",
      avatar: user.avatar
    });

  } catch (err) {
    console.error("Avatar update error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});

module.exports = router;
