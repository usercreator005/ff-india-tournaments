const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Lobby = require("../models/Lobby");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { body, validationResult } = require("express-validator");

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
   ASSIGN TEAM TO TOURNAMENT SLOT (PHASE 5 SAFE)
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (validate(req, res)) {
        await session.abortTransaction();
        session.endSession();
        return;
      }

      const { tournamentId, teamId, slotNumber } = req.body;

      /* =========================
         VERIFY TOURNAMENT
      ========================= */
      const tournamentFilter = req.isSuperAdmin
        ? { _id: tournamentId }
        : { _id: tournamentId, adminId: req.adminId };

      const tournament = await Tournament.findOne(tournamentFilter).session(session);

      if (!tournament) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      if (tournament.status !== "upcoming") {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, msg: "Cannot modify ongoing/past tournament" });
      }

      if (slotNumber > tournament.slots) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, msg: "Slot exceeds tournament capacity" });
      }

      if (tournament.filledSlots >= tournament.slots) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, msg: "Tournament slots already full" });
      }

      /* =========================
         VERIFY TEAM
      ========================= */
      const teamFilter = req.isSuperAdmin
        ? { _id: teamId }
        : { _id: teamId, adminId: req.adminId };

      const team = await Team.findOne(teamFilter).session(session);
      if (!team) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, msg: "Team not found" });
      }

      /* =========================
         CREATE LOBBY ENTRY
      ========================= */
      const lobbyEntry = await Lobby.create(
        [
          {
            tournamentId,
            teamId,
            slotNumber,
            adminId: tournament.adminId, // ensure correct boundary
          },
        ],
        { session }
      );

      /* =========================
         SAFE SLOT INCREMENT
      ========================= */
      tournament.filledSlots += 1;
      await tournament.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        success: true,
        msg: "Team assigned to slot successfully",
        lobby: lobbyEntry[0],
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      console.error("Assign team error:", err);

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
