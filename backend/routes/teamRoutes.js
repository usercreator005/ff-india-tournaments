const express = require("express");
const router = express.Router();

const Team = require("../models/Team");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { body, param, validationResult } = require("express-validator");

/* =========================
   VALIDATION HELPERS
========================= */
const validateTeamCreate = [
  body("name")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Team name must be at least 3 characters"),
];

const validateJoinTeam = [
  param("id").isMongoId().withMessage("Invalid team ID"),
];

const validateErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
    });
    return true;
  }
  return false;
};

/* =========================
   GET MY TEAM (USER ONLY)
   ✅ FIXED /team/my
========================= */
router.get("/my", auth, async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({
        success: false,
        msg: "Only users can access team data",
      });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    if (!user.teamId) {
      return res.json({
        success: true,
        hasTeam: false,
      });
    }

    const team = await Team.findById(user.teamId).lean();
    if (!team) {
      return res.json({
        success: true,
        hasTeam: false,
      });
    }

    res.json({
      success: true,
      hasTeam: true,
      team: {
        id: team._id,
        name: team.name,
        captain: team.leaderEmail,
        players: team.members,
      },
    });
  } catch (err) {
    console.error("Get my team error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
});

/* =========================
   CREATE TEAM (USER ONLY)
========================= */
router.post(
  "/create",
  apiLimiter,
  auth,
  validateTeamCreate,
  async (req, res) => {
    try {
      if (req.role !== "user") {
        return res.status(403).json({
          success: false,
          msg: "Only users can create team",
        });
      }

      if (validateErrors(req, res)) return;

      const user = await User.findOne({ email: req.user.email });
      if (!user) {
        return res.status(404).json({
          success: false,
          msg: "User not found",
        });
      }

      if (user.teamId) {
        return res.status(400).json({
          success: false,
          msg: "User already in a team",
        });
      }

      const team = await Team.create({
        name: req.body.name,
        leaderEmail: user.email,
        members: [user.email],
      });

      user.teamId = team._id;
      await user.save();

      res.status(201).json({
        success: true,
        msg: "Team created successfully",
        teamId: team._id,
      });
    } catch (err) {
      console.error("Create team error:", err);
      res.status(500).json({
        success: false,
        msg: "Server error",
      });
    }
  }
);

/* =========================
   JOIN TEAM (USER ONLY)
========================= */
router.post(
  "/join/:id",
  apiLimiter,
  auth,
  validateJoinTeam,
  async (req, res) => {
    try {
      if (req.role !== "user") {
        return res.status(403).json({
          success: false,
          msg: "Only users can join teams",
        });
      }

      if (validateErrors(req, res)) return;

      const user = await User.findOne({ email: req.user.email });
      if (!user) {
        return res.status(404).json({
          success: false,
          msg: "User not found",
        });
      }

      if (user.teamId) {
        return res.status(400).json({
          success: false,
          msg: "User already in a team",
        });
      }

      const team = await Team.findById(req.params.id);
      if (!team) {
        return res.status(404).json({
          success: false,
          msg: "Team not found",
        });
      }

      if (team.members.includes(user.email)) {
        return res.status(400).json({
          success: false,
          msg: "Already a team member",
        });
      }

      team.members.push(user.email);
      await team.save();

      user.teamId = team._id;
      await user.save();

      res.json({
        success: true,
        msg: "Joined team successfully",
      });
    } catch (err) {
      console.error("Join team error:", err);
      res.status(500).json({
        success: false,
        msg: "Server error",
      });
    }
  }
);

module.exports = router;
