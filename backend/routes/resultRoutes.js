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
  try {
    /* ---------- Try Admin Auth First ---------- */
    await new Promise((resolve, reject) => {
      adminAuth(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (req.admin) return next();
  } catch (e) {
    // Not admin, continue to staff check
  }

  /* ---------- Try Staff Auth ---------- */
  try {
    await new Promise((resolve, reject) => {
      verifyStaff(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (req.staff?.permissions?.canManageResults) {
      return next();
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
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
