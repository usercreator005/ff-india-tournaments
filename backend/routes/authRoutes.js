const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

/* =========================
   HELPERS
========================= */
const generateUsername = async () => {
  let username;
  let exists = true;

  while (exists) {
    username = "user" + Date.now().toString().slice(-5);
    exists = await User.exists({ username });
  }

  return username;
};

/* =========================
   GET USER ROLE
   🔥 ALSO ENSURES USER + USERNAME
========================= */
router.get("/role", authMiddleware, async (req, res) => {
  try {
    let user = await User.findOne({ email: req.user.email });

    // 🆕 First time login → create user
    if (!user) {
      const username = await generateUsername();

      user = await User.create({
        email: req.user.email,
        role: "user",
        username
      });
    }

    // 🛠 Old user but username missing (BUG FIX)
    if (!user.username) {
      user.username = await generateUsername();
      await user.save();
    }

    res.json({
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error("Auth /role error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});

/* =========================
   GET LOGGED IN USER
========================= */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    let user = await User.findOne(
      { email: req.user.email },
      "-__v"
    );

    if (!user) {
      const username = await generateUsername();

      user = await User.create({
        email: req.user.email,
        role: "user",
        username
      });
    }

    if (!user.username) {
      user.username = await generateUsername();
      await user.save();
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
