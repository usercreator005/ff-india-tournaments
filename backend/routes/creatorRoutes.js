const express = require("express");
const router = express.Router();
const HotSlot = require("../models/HotSlot");
const Admin = require("../models/Admin");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

// Dashboard stats
router.get("/stats", auth, async (req, res) => {
  if (req.role !== "creator") return res.sendStatus(403);

  const users = await User.countDocuments();
  const admins = await Admin.find();

  res.json({
    totalUsers: users,
    admins
  });
});

// Create Admin (CREATOR ONLY)
router.post("/create-admin", auth, async (req, res) => {
  if (req.role !== "creator") return res.sendStatus(403);

  const exists = await Admin.findOne({ email: req.body.email });
  if (exists) {
    return res.status(400).json({ msg: "Admin already exists" });
  }

  const admin = await Admin.create(req.body);
  res.json({ msg: "Admin created", admin });
});

// ❗ FIXED: Remove Admin (CREATOR ONLY)
router.delete("/remove-admin/:email", auth, async (req, res) => {
  if (req.role !== "creator") return res.sendStatus(403);

  await Admin.deleteOne({ email: req.params.email });
  res.json({ msg: "Admin removed" });
});

// Hot Slot Post
router.post("/hot-slot", auth, async (req, res) => {
  if (req.role !== "creator") return res.sendStatus(403);

  const slot = await HotSlot.create({
    ...req.body,
    contact: `DM ME FOR DETAILS - ${req.body.contact}`
  });

  res.json({ msg: "Hot slot posted", slot });
});

module.exports = router;
