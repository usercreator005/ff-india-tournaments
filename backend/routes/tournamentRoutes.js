const express = require("express");
const router = express.Router();
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");

// Create tournament
router.post("/create", auth, async (req, res) => {
  if (req.role !== "admin") return res.status(403).json({ msg: "Only admin" });

  const t = await Tournament.create({
    ...req.body,
    createdBy: req.user.email,
    status: "upcoming"
  });

  res.json({ msg: "Tournament created", t });
});

// Fetch tournaments
// Public tournaments (USER VIEW)
router.get("/public/:status", async (req, res) => {
  const tournaments = await Tournament.find({
    status: req.params.status
  }).sort({ createdAt: -1 });

  res.json(tournaments);
});

module.exports = router;
