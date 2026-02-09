const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
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
   ASSIGN TEAM TO TOURNAMENT SLOT (PHASE 5 SAFE)
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
        return session.endSession();
      }

      const { tournamentId, teamId, slotNumber } = req.body;

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

      const teamFilter = req.isSuperAdmin
        ? { _id: teamId }
        : { _id: teamId, adminId: req.adminId };

      const team = await Team.findOne(teamFilter).session(session);
      if (!team) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, msg: "Team not found" });
      }

      const lobbyEntry = await Lobby.create(
        [{ tournamentId, teamId, slotNumber, adminId: tournament.adminId }],
        { session }
      );

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

      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          msg: "Slot already taken or team already joined",
        });
      }

      console.error("Assign team error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =======================================================
   VIEW LOBBY FOR A TOURNAMENT (ADMIN DASHBOARD)
======================================================= */
router.get(
  "/tournament/:tournamentId",
  apiLimiter,
  auth,
  adminOnly,
  param("tournamentId").isMongoId(),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const tournamentFilter = req.isSuperAdmin
        ? { _id: req.params.tournamentId }
        : { _id: req.params.tournamentId, adminId: req.adminId };

      const tournament = await Tournament.findOne(tournamentFilter);
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      const filter = req.isSuperAdmin
        ? { tournamentId: tournament._id }
        : { tournamentId: tournament._id, adminId: req.adminId };

      const lobby = await Lobby.find(filter)
        .populate("teamId", "name players")
        .sort({ slotNumber: 1 });

      res.json({
        success: true,
        tournament: {
          id: tournament._id,
          name: tournament.name,
          totalSlots: tournament.slots,
          filledSlots: tournament.filledSlots,
          slotsLeft: tournament.slots - tournament.filledSlots,
        },
        count: lobby.length,
        lobby,
      });
    } catch (err) {
      console.error("Fetch lobby error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =======================================================
   REMOVE TEAM FROM LOBBY SLOT (ADMIN FIX TOOL)
======================================================= */
router.delete(
  "/remove/:lobbyId",
  apiLimiter,
  auth,
  adminOnly,
  param("lobbyId").isMongoId(),
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const filter = req.isSuperAdmin
        ? { _id: req.params.lobbyId }
        : { _id: req.params.lobbyId, adminId: req.adminId };

      const lobbyEntry = await Lobby.findOne(filter).session(session);
      if (!lobbyEntry) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, msg: "Lobby entry not found" });
      }

      const tournament = await Tournament.findById(lobbyEntry.tournamentId).session(session);
      if (tournament && tournament.filledSlots > 0) {
        tournament.filledSlots -= 1;
        await tournament.save({ session });
      }

      await lobbyEntry.deleteOne({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({ success: true, msg: "Team removed from slot" });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Remove team error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
