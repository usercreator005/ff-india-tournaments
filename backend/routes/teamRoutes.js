const express = require("express");
const router = express.Router();

const Team = require("../models/Team");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

/* =========================
   CREATE TEAM (USER ONLY)
========================= */
router.post("/create", auth, async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({ msg: "Only users can create team" });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.teamId) {
      return res.status(400).json({ msg: "Already in a team" });
    }

    if (!req.body.name) {
      return res.status(400).json({ msg: "Team name required" });
    }

    const team = await Team.create({
      name: req.body.name,
      leaderEmail: user.email,
      members: [user.email]
    });

    user.teamId = team._id;
    await user.save();

    res.json({ msg: "Team created", team });

  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   JOIN TEAM (USER ONLY)
========================= */
router.post("/join/:id", auth, async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({ msg: "Only users can join teams" });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.teamId) {
      return res.status(400).json({ msg: "Already in a team" });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    if (team.members.includes(user.email)) {
      return res.status(400).json({ msg: "Already a member" });
    }

    team.members.push(user.email);
    await team.save();

    user.teamId = team._id;
    await user.save();

    res.json({ msg: "Joined team", team });

  } catch (err) {
    console.error("Join team error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
