const express = require("express");
const router = express.Router();
const MatchRoom = require("../models/MatchRoom");
const Tournament = require("../models/Tournament");
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
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const { tournamentId, roomId, roomPassword } = req.body;

      // Ensure tournament belongs to this admin
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
        adminId: req.adminId,
      });

      res.status(201).json({ success: true, msg: "Room created", room });
    } catch (err) {
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

      room.isPublished = true;
      room.publishedAt = new Date();
      await room.save();

      res.json({ success: true, msg: "Room published", room });
    } catch (err) {
      console.error("Publish room error:", err);
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

      const rooms = await MatchRoom.find(filter).sort({ round: 1 });

      res.json({ success: true, rooms });
    } catch (err) {
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   PLAYER VIEW ROOM (ONLY AFTER PUBLISH)
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

      const room = await MatchRoom.findOne({
        tournamentId: req.params.tournamentId,
        isPublished: true,
      });

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
        publishedAt: room.publishedAt,
      });
    } catch (err) {
      console.error("Player room fetch error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
