const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

// Create Team
router.post("/create", auth, async (req, res) => {
  if (req.role !== "user") return res.status(403).json({ msg: "Only users" });

  const existingUser = await User.findOne({ email: req.user.email });
  if (existingUser.teamId) {
    return res.status(400).json({ msg: "Already in a team" });
  }

  const team = await Team.create({
    name: req.body.name,
    leaderEmail: req.user.email,
    members: [req.user.email]
  });

  existingUser.teamId = team._id;
  await existingUser.save();

  res.json({ msg: "Team created", team });
});

// Join Team
router.post("/join/:id", auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  if (user.teamId) return res.status(400).json({ msg: "Already in team" });

  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ msg: "Team not found" });

  team.members.push(req.user.email);
  await team.save();

  user.teamId = team._id;
  await user.save();

  res.json({ msg: "Joined team" });
});

module.exports = router;
