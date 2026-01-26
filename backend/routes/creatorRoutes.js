const express = require("express");
const router = express.Router();

const HotSlot = require("../models/HotSlot");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");

/* =========================
   CREATOR DASHBOARD STATS
========================= */
router.get("/stats", auth, async (req, res) => {
  try {
    if (req.role !== "creator") return res.sendStatus(403);

    const totalUsers = await User.countDocuments();
    const admins = await Admin.find();
    const activeTournaments = await Tournament.countDocuments({
      status: "upcoming"
    });

    res.json({
      totalUsers,
      activeTournaments,
      admins
    });
  } catch (err) {
    console.error("Creator stats error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   CREATE ADMIN (CREATOR ONLY)
========================= */
router.post("/create-admin", auth, async (req, res) => {
  try {
    if (req.role !== "creator") return res.sendStatus(403);

    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ msg: "Name and email required" });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Admin already exists" });
    }

    const admin = await Admin.create({ name, email });
    res.json({ msg: "Admin created", admin });

  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   REMOVE ADMIN (CREATOR ONLY)
========================= */
router.delete("/remove-admin/:email", auth, async (req, res) => {
  try {
    if (req.role !== "creator") return res.sendStatus(403);

    if (req.params.email === req.user.email) {
      return res.status(400).json({ msg: "Cannot remove yourself" });
    }

    await Admin.deleteOne({ email: req.params.email });
    res.json({ msg: "Admin removed" });

  } catch (err) {
    console.error("Remove admin error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   POST HOT SLOT (CREATOR ONLY)
========================= */
router.post("/hot-slot", auth, async (req, res) => {
  try {
    if (req.role !== "creator") return res.sendStatus(403);

    const slot = await HotSlot.create({
      tournament: req.body.tournament,
      prizePool: req.body.prizePool,
      stage: req.body.stage,
      slots: req.body.slots,
      contact: `DM ME FOR DETAILS - ${req.body.contact}`
    });

    res.json({ msg: "Hot slot posted", slot });

  } catch (err) {
    console.error("Hot slot error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
