const express = require("express");
const router = express.Router();
const MatchRoom = require("../models/MatchRoom");
const Tournament = require("../models/Tournament");
const Lobby = require("../models/Lobby");
const Team = require("../models/Team");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { body, param, validationResult } = require("express-validator");

/* 🔔 PHASE 7 REMINDER SERVICE */
const { sendRoomPublishedNotification } = require("../services/reminderScheduler");

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

/* =========================
   CREATE ROOM (ADMIN)
========================= */
router.post(
  "/create",
  apiLimiter,
  auth,
  adminOnly,
  body("tournamentId").isMongoId(),
  body("roomId").trim().notEmpty(),
  body("roomPassword").trim().notEmpty(),
  body("round").optional().isInt({ min: 1 }),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const { tournamentId, roomId, roomPassword, round = 1 } = req.body;

      const filter = req.isSuperAdmin
        ? { _id: tournamentId }
        : { _id: tournamentId, adminId: req.adminId };

      const tournament = await Tournament.findOne(filter);
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      const room = await MatchRoom.create({
        tournamentId,
        roomId,
        roomPassword,
        round,
        adminId: tournament.adminId,
      });

      res.status(201).json({ success: true, msg: "Room created", room });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          msg: "Room for this round already exists",
        });
      }
      console.error("Create room error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   PUBLISH ROOM (ADMIN)
========================= */
router.patch(
  "/publish/:id",
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

      const room = await MatchRoom.findOne(filter);
      if (!room) {
        return res.status(404).json({ success: false, msg: "Room not found" });
      }

      if (room.isPublished) {
        return res.status(400).json({ success: false, msg: "Room already published" });
      }

      room.isPublished = true;
      room.publishedAt = new Date();
      await room.save();

      /* 🔔 PHASE 7 — Notify all joined teams that room is live */
      await sendRoomPublishedNotification(room);

      res.json({ success: true, msg: "Room published", publishedAt: room.publishedAt });
    } catch (err) {
      console.error("Publish room error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   DISABLE ROOM (ADMIN)
========================= */
router.patch(
  "/disable/:id",
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

      const room = await MatchRoom.findOne(filter);
      if (!room) {
        return res.status(404).json({ success: false, msg: "Room not found" });
      }

      room.isActive = false;
      await room.save();

      res.json({ success: true, msg: "Room disabled" });
    } catch (err) {
      console.error("Disable room error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   ADMIN VIEW ROOMS
========================= */
router.get(
  "/admin/:tournamentId",
  apiLimiter,
  auth,
  adminOnly,
  param("tournamentId").isMongoId(),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const filter = req.isSuperAdmin
        ? { tournamentId: req.params.tournamentId }
        : { tournamentId: req.params.tournamentId, adminId: req.adminId };

      const rooms = await MatchRoom.find(filter)
        .select("+roomPassword")
        .sort({ round: 1 });

      res.json({ success: true, rooms });
    } catch (err) {
      console.error("Admin room fetch error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   PLAYER VIEW ROOM (TEAM BASED ACCESS)
========================= */
router.get(
  "/tournament/:tournamentId",
  apiLimiter,
  auth,
  param("tournamentId").isMongoId(),
  async (req, res) => {
    try {
      if (req.role !== "user") {
        return res.status(403).json({ success: false, msg: "Users only" });
      }

      if (validate(req, res)) return;

      const lobbyEntries = await Lobby.find({ tournamentId: req.params.tournamentId })
        .populate("teamId", "members");

      const isParticipant = lobbyEntries.some(entry =>
        entry.teamId?.members?.includes(req.user.email)
      );

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          msg: "You are not a participant of this tournament",
        });
      }

      const room = await MatchRoom.findOne({
        tournamentId: req.params.tournamentId,
        isPublished: true,
        isActive: true,
      }).select("+roomPassword");

      if (!room) {
        return res.status(404).json({
          success: false,
          msg: "Room not published yet. Wait for admin.",
        });
      }

      res.json({
        success: true,
        roomId: room.roomId,
        roomPassword: room.roomPassword,
        round: room.round,
        publishedAt: room.publishedAt,
      });
    } catch (err) {
      console.error("Player room fetch error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
