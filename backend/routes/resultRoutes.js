const express = require("express");
const router = express.Router();

const {
  upsertTeamResult,
  lockMatchResults,
  getMatchLeaderboard,
  getStageLeaderboard,
  deleteTeamResult,
} = require("../controllers/resultController");

const adminAuth = require("../middleware/adminAuth");
const { verifyStaff } = require("../middleware/staffAuth");

/* =======================================================
   🔐 ADMIN OR STAFF (RESULT MANAGER) ACCESS MIDDLEWARE
   Allows:
   ✅ Admin (full access)
   ✅ Staff with canManageResults = true
======================================================= */
const adminOrResultStaff = async (req, res, next) => {
  // First try admin auth
  adminAuth(req, res, async (adminErr) => {
    if (!adminErr && req.admin) {
      return next(); // Admin allowed
    }

    // If not admin, try staff auth
    verifyStaff(req, res, () => {
      if (req.staff?.permissions?.canManageResults) {
        return next(); // Staff with permission allowed
      }
      return res.status(403).json({ message: "Access denied" });
    });
  });
};

/* =======================================================
   🎯 PHASE 8 — RESULT MANAGEMENT SYSTEM
   Base Path: /api/v1/results
   Admin + Result Staff access
======================================================= */

/* 📌 Upload or Update a Team Result (Per Match) */
router.post("/team", adminOrResultStaff, upsertTeamResult);

/* 🔒 Lock All Results for a Match */
router.patch("/lock/:matchRoomId", adminOrResultStaff, lockMatchResults);

/* 📊 Get Match Leaderboard (Single Match) */
router.get(
  "/leaderboard/match/:matchRoomId",
  adminOrResultStaff,
  getMatchLeaderboard
);

/* 🏆 Get Stage Leaderboard (Stage Total) */
router.get(
  "/leaderboard/stage/:tournamentId/:stageNumber",
  adminOrResultStaff,
  getStageLeaderboard
);

/* 🗑 Delete a Team Result (Only Before Lock) */
router.delete("/team/:resultId", adminOrResultStaff, deleteTeamResult);

module.exports = router;
