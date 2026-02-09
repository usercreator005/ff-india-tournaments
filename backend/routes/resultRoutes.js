const express = require("express");
const router = express.Router();

const {
  upsertTeamResult,
  lockMatchResults,
  getMatchLeaderboard,
  getStageLeaderboard, // 🆕 Stage totals
  deleteTeamResult,
} = require("../controllers/resultController");

const adminAuth = require("../middleware/adminAuth");

/* =======================================================
   🎯 PHASE 8 — RESULT MANAGEMENT SYSTEM
   Base Path: /api/v1/results
   🔐 Admin data boundary enforced via adminAuth
======================================================= */

/* 📌 Upload or Update a Team Result (Per Match)
   Body: { matchRoomId, teamId, position, kills, notes }
*/
router.post("/team", adminAuth, upsertTeamResult);

/* 🔒 Lock All Results for a Match (Finalize Match Leaderboard) */
router.patch("/lock/:matchRoomId", adminAuth, lockMatchResults);

/* 📊 Get Match Leaderboard (Single Match) */
router.get("/leaderboard/match/:matchRoomId", adminAuth, getMatchLeaderboard);

/* 🏆 Get Stage Leaderboard (Total of All Matches in Stage)
   Params: tournamentId, stageNumber
*/
router.get(
  "/leaderboard/stage/:tournamentId/:stageNumber",
  adminAuth,
  getStageLeaderboard
);

/* 🗑 Delete a Team Result (Only Before Lock) */
router.delete("/team/:resultId", adminAuth, deleteTeamResult);

module.exports = router;
