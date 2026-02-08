const express = require("express");
const router = express.Router();
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { param, body, validationResult } = require("express-validator");

/* =========================
   HELPERS
========================= */
const adminOnly = (req, res, next) => {
  if (req.role !== "admin" && !req.isSuperAdmin) {
    return res.status(403).json({ success: false, msg: "Admin only" });
  }
  next();
};

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

/* =================================================
   GET FULL TOURNAMENT DETAILS (ADMIN PANEL VIEW)
================================================= */
router.get(
  "/details/:id",
  apiLimiter,
  auth,
  adminOnly,
  param("id").isMongoId(),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const filter = req.isSuperAdmin
        ? { _id: req.params.id }
        : { _id: req.params.id, adminId: req.adminId };

      const tournament = await Tournament.findOne(filter);
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      res.json({ success: true, tournament });
    } catch (err) {
      console.error("Admin fetch tournament error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =================================================
   FORCE REMOVE PLAYER (ADMIN CONTROL)
================================================= */
router.patch(
  "/remove-player",
  apiLimiter,
  auth,
  adminOnly,
  body("tournamentId").isMongoId(),
  body("email").isEmail(),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const { tournamentId, email } = req.body;

      const filter = req.isSuperAdmin
        ? { _id: tournamentId }
        : { _id: tournamentId, adminId: req.adminId };

      const tournament = await Tournament.findOne(filter);
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      if (!tournament.players.includes(email)) {
        return res.status(400).json({ success: false, msg: "Player not in tournament" });
      }

      tournament.players = tournament.players.filter((p) => p !== email);
      tournament.filledSlots = Math.max(tournament.filledSlots - 1, 0);

      await tournament.save();

      res.json({ success: true, msg: "Player removed" });
    } catch (err) {
      console.error("Remove player error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =================================================
   FORCE ADD PLAYER (ADMIN MANUAL SLOT FILL)
================================================= */
router.patch(
  "/add-player",
  apiLimiter,
  auth,
  adminOnly,
  body("tournamentId").isMongoId(),
  body("email").isEmail(),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const { tournamentId, email } = req.body;

      const filter = req.isSuperAdmin
        ? { _id: tournamentId }
        : { _id: tournamentId, adminId: req.adminId };

      const tournament = await Tournament.findOne(filter);
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      if (tournament.players.includes(email)) {
        return res.status(400).json({ success: false, msg: "Player already added" });
      }

      if (tournament.filledSlots >= tournament.slots) {
        return res.status(400).json({ success: false, msg: "Tournament is full" });
      }

      tournament.players.push(email);
      tournament.filledSlots += 1;

      await tournament.save();

      res.json({ success: true, msg: "Player added manually" });
    } catch (err) {
      console.error("Add player error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =================================================
   RESET TOURNAMENT (EMERGENCY ADMIN TOOL)
   Clears all players & slots
================================================= */
router.patch(
  "/reset/:id",
  apiLimiter,
  auth,
  adminOnly,
  param("id").isMongoId(),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const filter = req.isSuperAdmin
        ? { _id: req.params.id }
        : { _id: req.params.id, adminId: req.adminId };

      const tournament = await Tournament.findOne(filter);
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      tournament.players = [];
      tournament.filledSlots = 0;
      tournament.status = "upcoming";

      await tournament.save();

      res.json({ success: true, msg: "Tournament reset successfully" });
    } catch (err) {
      console.error("Reset tournament error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
