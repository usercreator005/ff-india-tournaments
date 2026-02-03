const express = require("express");
const router = express.Router();

const Team = require("../models/Team");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { body, param, validationResult } = require("express-validator");

/* =========================
   HELPERS
========================= */
const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const validateErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      msg: errors.array()[0].msg
    });
  }
};

/* =========================
   VALIDATIONS
========================= */
const validateTeamCreate = [
  body("name").trim().isLength({ min: 3 }),
  body("whatsapp")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Valid WhatsApp number required")
];

const validateJoinTeamById = [
  param("id").isMongoId()
];

const validateJoinByCode = [
  body("inviteCode").trim().isLength({ min: 5, max: 8 })
];

/* =========================
   GET MY TEAM
========================= */
router.get("/my", auth, async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({ success: false });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user || !user.teamId) {
      return res.json({ success: true, hasTeam: false });
    }

    const team = await Team.findById(user.teamId).lean();
    if (!team) {
      return res.json({ success: true, hasTeam: false });
    }

    return res.json({
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
    res.status(500).json({ success: false });
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
        return res.status(403).json({ success: false });
      }

      if (validateErrors(req, res)) return;

      const user = await User.findOne({ email: req.user.email });
      if (!user || user.teamId) {
        return res.status(400).json({
          success: false,
          msg: "User already in a team"
        });
      }

      if (!user.username) {
        return res.status(400).json({
          success: false,
          msg: "Username not set"
        });
      }

      const inviteCode = generateInviteCode();

      const team = await Team.create({
        name: req.body.name.trim(),
        whatsapp: req.body.whatsapp.trim(),
        leaderEmail: user.email,
        members: [user.username], // ✅ username
        inviteCode
      });

      user.teamId = team._id;
      await user.save();

      res.status(201).json({
        success: true,
        msg: "Team created",
        inviteCode
      });
    } catch (err) {
      console.error("Create team error:", err);
      res.status(500).json({ success: false });
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
        return res.status(403).json({ success: false });
      }

      if (validateErrors(req, res)) return;

      const user = await User.findOne({ email: req.user.email });
      if (!user || user.teamId || !user.username) {
        return res.status(400).json({
          success: false,
          msg: "Cannot join team"
        });
      }

      const team = await Team.findOne({
        inviteCode: req.body.inviteCode.trim().toUpperCase()
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          msg: "Invalid invite code"
        });
      }

      if (team.members.includes(user.username)) {
        return res.status(400).json({
          success: false,
          msg: "Already in this team"
        });
      }

      if (team.members.length >= 6) {
        return res.status(400).json({
          success: false,
          msg: "Team is full"
        });
      }

      team.members.push(user.username);
      await team.save();

      user.teamId = team._id;
      await user.save();

      res.json({
        success: true,
        msg: "Joined team"
      });
    } catch (err) {
      console.error("Join team error:", err);
      res.status(500).json({ success: false });
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
      return res.status(400).json({ success: false });
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
        msg: "Captain cannot leave"
      });
    }

    team.members = team.members.filter(
      (u) => u !== user.username
    );
    await team.save();

    user.teamId = null;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Leave team error:", err);
    res.status(500).json({ success: false });
  }
});

/* =========================
   DISBAND TEAM
========================= */
router.post("/disband", apiLimiter, auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user || !user.teamId) {
      return res.status(400).json({ success: false });
    }

    const team = await Team.findById(user.teamId);
    if (!team) {
      user.teamId = null;
      await user.save();
      return res.json({ success: true });
    }

    if (team.leaderEmail !== user.email) {
      return res.status(403).json({ success: false });
    }

    await User.updateMany(
      { teamId: team._id },
      { $set: { teamId: null } }
    );

    await Team.findByIdAndDelete(team._id);

    res.json({ success: true });
  } catch (err) {
    console.error("Disband error:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
