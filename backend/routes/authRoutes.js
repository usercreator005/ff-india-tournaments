const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

/* =========================
   GET USER ROLE (EXISTING)
========================= */
router.get("/role", authMiddleware, (req, res) => {
  res.json({
    email: req.user.email,
    role: req.role
  });
});

/* =========================
   GET LOGGED IN USER (NEW)
   🔥 REQUIRED FOR AVATAR
========================= */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne(
      { email: req.user.email },
      "-__v"
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
    console.error("Auth /me error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});

module.exports = router;
