const express = require("express");
const router = express.Router();
const Lobby = require("../models/Lobby");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { body, param, validationResult } = require("express-validator");

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

/* =======================================================
   ASSIGN TEAM TO TOURNAMENT SLOT
   POST /api/lobby/assign
======================================================= */
router.post(
  "/assign",
  apiLimiter,
  auth,
  adminOnly,
  body("tournamentId").isMongoId(),
  body("teamId").isMongoId(),
  body("slotNumber").isInt({ min: 1 }),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const { tournamentId, teamId, slotNumber } = req.body;

      /* =========================
         VERIFY TOURNAMENT (ADMIN BOUNDARY SAFE)
      ========================= */
      const tournamentFilter = req.isSuperAdmin
        ? { _id: tournamentId }
        : { _id: tournamentId, adminId: req.adminId };

      const tournament = await Tournament.findOne(tournamentFilter);
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      if (tournament.status !== "upcoming") {
        return res.status(400).json({ success: false, msg: "Cannot modify ongoing/past tournament" });
      }

      if (slotNumber > tournament.slots) {
        return res.status(400).json({ success: false, msg: "Slot exceeds tournament capacity" });
      }

      /* =========================
         VERIFY TEAM (SAME ADMIN)
      ========================= */
      const teamFilter = req.isSuperAdmin
        ? { _id: teamId }
        : { _id: teamId, adminId: req.adminId };

      const team = await Team.findOne(teamFilter);
      if (!team) {
        return res.status(404).json({ success: false, msg: "Team not found" });
      }

      /* =========================
         PREVENT DUPLICATE TEAM ENTRY
      ========================= */
      const existingTeamEntry = await Lobby.findOne({
        tournamentId,
        teamId,
      });

      if (existingTeamEntry) {
        return res.status(400).json({
          success: false,
          msg: "Team already assigned in this tournament",
        });
      }

      /* =========================
         CREATE LOBBY ENTRY
      ========================= */
      const lobbyEntry = await Lobby.create({
        tournamentId,
        teamId,
        slotNumber,
        adminId: tournament.adminId, // always follow tournament owner
      });

      /* =========================
         SAFE SLOT COUNT INCREMENT
      ========================= */
      const updatedTournament = await Tournament.findOneAndUpdate(
        {
          _id: tournament._id,
          filledSlots: { $lt: tournament.slots },
        },
        { $inc: { filledSlots: 1 } },
        { new: true }
      );

      if (!updatedTournament) {
        // rollback lobby entry if slots became full in race condition
        await Lobby.deleteOne({ _id: lobbyEntry._id });

        return res.status(400).json({
          success: false,
          msg: "Tournament slots are full",
        });
      }

      res.status(201).json({
        success: true,
        msg: "Team assigned to slot successfully",
        lobby: lobbyEntry,
      });
    } catch (err) {
      console.error("Assign team error:", err);

      // Duplicate slot OR duplicate team (index safety)
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          msg: "Slot already taken or team already joined",
        });
      }

      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
