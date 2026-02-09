const express = require("express");
const router = express.Router();

const {
  upsertTeamResult,
  lockMatchResults,
  getMatchLeaderboard,
  deleteTeamResult,
} = require("../controllers/resultController");

const adminAuth = require("../middleware/adminAuth");

/* =======================================================
   🎯 PHASE 8 — MATCH RESULT MANAGEMENT (ADMIN)
   Base Path: /api/v1/results
   🔐 Admin data boundary enforced via adminAuth
======================================================= */

/* 📌 Upload or Update a Team Result
   Body: { matchRoomId, teamId, position, kills, placementPoints, killPoints, notes }
*/
router.post("/team", adminAuth, upsertTeamResult);

/* 🔒 Lock All Results for a Match (finalize leaderboard)
   Prevents any further edits
*/
router.patch("/lock/:matchRoomId", adminAuth, lockMatchResults);

/* 📊 Get Match Leaderboard (sorted by points > kills) */
router.get("/leaderboard/:matchRoomId", adminAuth, getMatchLeaderboard);

/* 🗑 Delete a Team Result (only before locking) */
router.delete("/team/:resultId", adminAuth, deleteTeamResult);

module.exports = router;
