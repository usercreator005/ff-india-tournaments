const express = require("express");
const router = express.Router();
const Lobby = require("../models/Lobby");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { param, validationResult } = require("express-validator");

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
   GET FULL LOBBY FOR A TOURNAMENT (ADMIN)
   GET /api/lobby/admin/:tournamentId
======================================================= */
router.get(
  "/admin/:tournamentId",
  apiLimiter,
  auth,
  adminOnly,
  param("tournamentId").isMongoId(),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const { tournamentId } = req.params;

      /* =========================
         VERIFY TOURNAMENT ACCESS
      ========================= */
      const tournamentFilter = req.isSuperAdmin
        ? { _id: tournamentId }
        : { _id: tournamentId, adminId: req.adminId };

      const tournament = await Tournament.findOne(tournamentFilter);
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      /* =========================
         FETCH LOBBY DATA
      ========================= */
      const lobby = await Lobby.find({ tournamentId })
        .populate({
          path: "teamId",
          select: "name logo players",
        })
        .sort({ slotNumber: 1 });

      res.json({
        success: true,
        tournament: {
          id: tournament._id,
          name: tournament.name,
          slots: tournament.slots,
          filledSlots: tournament.filledSlots,
          slotsLeft: tournament.slotsLeft,
          status: tournament.status,
        },
        lobby,
      });
    } catch (err) {
      console.error("Admin lobby fetch error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
