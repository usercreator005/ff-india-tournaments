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
   🎯 PHASE 8 — RESULT MANAGEMENT (ADMIN)
   Base Path: /api/v1/results
======================================================= */

/* 📌 Upload or Update a Team Result */
router.post("/team", adminAuth, upsertTeamResult);

/* 🔒 Lock All Results for a Match */
router.patch("/lock/:matchRoomId", adminAuth, lockMatchResults);

/* 📊 Get Match Leaderboard */
router.get("/leaderboard/:matchRoomId", adminAuth, getMatchLeaderboard);

/* 🗑 Delete a Team Result (before locking) */
router.delete("/team/:resultId", adminAuth, deleteTeamResult);

module.exports = router;
