const express = require("express");
const router = express.Router();

const Team = require("../models/Team");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { body, validationResult } = require("express-validator");

/* =========================
   HELPERS
========================= */
const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const validateErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
    return true;
  }
  return false;
};

/* =========================
   VALIDATIONS
========================= */
const validateTeamCreate = [
  body("name")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Team name too short"),

  body("whatsapp")
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Valid WhatsApp number required")
];

const validateJoinByCode = [
  body("inviteCode")
    .trim()
    .isLength({ min: 5, max: 8 })
    .withMessage("Invalid invite code")
];

/* =========================
   GET MY TEAM
========================= */
router.get("/my", auth, async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user || !user.teamId) {
      return res.json({ success: true, hasTeam: false });
    }

    const team = await Team.findById(user.teamId).lean();
    if (!team) {
      return res.json({ success: true, hasTeam: false });
    }

    res.json({
      success: true,
      hasTeam: true,
      team: {
        id: team._id,
        name: team.name,
        whatsapp: team.whatsapp,
        captain: team.leaderEmail,
        members: team.members,
        inviteCode: team.inviteCode
      }
    });
  } catch (err) {
    console.error("Get team error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =========================
   CREATE TEAM
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
          message: "Access denied"
        });
      }

      if (validateErrors(req, res)) return;

      const user = await User.findOne({ email: req.user.email });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found"
        });
      }

      if (user.teamId) {
        return res.status(400).json({
          success: false,
          message: "User already in a team"
        });
      }

      if (!user.username) {
        return res.status(400).json({
          success: false,
          message: "Username not set"
        });
      }

      const team = await Team.create({
        name: req.body.name.trim(),
        whatsapp: req.body.whatsapp.trim(),
        leaderEmail: user.email,
        members: [user.username],
        inviteCode: generateInviteCode()
      });

      user.teamId = team._id;
      await user.save();

      res.status(201).json({
        success: true,
        message: "Team created successfully",
        inviteCode: team.inviteCode
      });
    } catch (err) {
      console.error("Create team error:", err);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);

/* =========================
   JOIN TEAM (INVITE CODE)
========================= */
router.post(
  "/join-by-code",
  apiLimiter,
  auth,
  validateJoinByCode,
  async (req, res) => {
    try {
      if (req.role !== "user") {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }

      if (validateErrors(req, res)) return;

      const user = await User.findOne({ email: req.user.email });
      if (!user || user.teamId || !user.username) {
        return res.status(400).json({
          success: false,
          message: "Cannot join team"
        });
      }

      const team = await Team.findOne({
        inviteCode: req.body.inviteCode.trim().toUpperCase()
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Invalid invite code"
        });
      }

      if (team.members.length >= 6) {
        return res.status(400).json({
          success: false,
          message: "Team is full"
        });
      }

      team.members.push(user.username);
      await team.save();

      user.teamId = team._id;
      await user.save();

      res.json({
        success: true,
        message: "Joined team successfully"
      });
    } catch (err) {
      console.error("Join team error:", err);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);

/* =========================
   LEAVE TEAM
========================= */
router.post("/leave", apiLimiter, auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user || !user.teamId || !user.username) {
      return res.status(400).json({
        success: false,
        message: "Cannot leave team"
      });
    }

    const team = await Team.findById(user.teamId);
    if (!team) {
      user.teamId = null;
      await user.save();
      return res.json({ success: true });
    }

    if (team.leaderEmail === user.email) {
      return res.status(400).json({
        success: false,
        message: "Captain cannot leave the team"
      });
    }

    team.members = team.members.filter(
      member => member !== user.username
    );
    await team.save();

    user.teamId = null;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Leave team error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =========================
   DISBAND TEAM
========================= */
router.post("/disband", apiLimiter, auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user || !user.teamId) {
      return res.status(400).json({
        success: false,
        message: "Invalid request"
      });
    }

    const team = await Team.findById(user.teamId);
    if (!team) {
      user.teamId = null;
      await user.save();
      return res.json({ success: true });
    }

    if (team.leaderEmail !== user.email) {
      return res.status(403).json({
        success: false,
        message: "Only captain can disband the team"
      });
    }

    await User.updateMany(
      { teamId: team._id },
      { $set: { teamId: null } }
    );

    await Team.findByIdAndDelete(team._id);

    res.json({ success: true });
  } catch (err) {
    console.error("Disband team error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
