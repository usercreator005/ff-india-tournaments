const express = require("express");
const router = express.Router();
const Lobby = require("../models/Lobby");
const Tournament = require("../models/Tournament");
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
   ❌ REMOVE TEAM FROM SLOT (ADMIN)
   DELETE /api/lobby/admin/remove/:lobbyId
======================================================= */
router.delete(
  "/admin/remove/:lobbyId",
  apiLimiter,
  auth,
  adminOnly,
  param("lobbyId").isMongoId(),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const { lobbyId } = req.params;

      /* =========================
         FIND LOBBY SLOT
      ========================= */
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby) {
        return res.status(404).json({ success: false, msg: "Lobby slot not found" });
      }

      /* =========================
         VERIFY TOURNAMENT ACCESS
      ========================= */
      const tournamentFilter = req.isSuperAdmin
        ? { _id: lobby.tournamentId }
        : { _id: lobby.tournamentId, adminId: req.adminId };

      const tournament = await Tournament.findOne(tournamentFilter);
      if (!tournament) {
        return res.status(403).json({ success: false, msg: "Not allowed" });
      }

      /* =========================
         REMOVE SLOT ENTRY
      ========================= */
      await lobby.deleteOne();

      // Decrease filled slots safely
      if (tournament.filledSlots > 0) {
        tournament.filledSlots -= 1;
        await tournament.save();
      }

      res.json({
        success: true,
        msg: "Team removed from slot",
        updatedFilledSlots: tournament.filledSlots,
        slotsLeft: tournament.slotsLeft,
      });
    } catch (err) {
      console.error("Remove lobby team error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
