const express = require("express");
const router = express.Router();

const {
  generateStageResults,
  getStageLeaderboard,
  markStageQualified,
} = require("../controllers/stageResultController");

const adminAuth = require("../middleware/adminAuth");

/* =======================================================
   🎯 PHASE 9 — STAGE RESULT MANAGEMENT (ADMIN)
   Base Path: /api/v1/stage-results
   🔐 Admin boundary enforced
======================================================= */

/* 📊 Generate Stage Leaderboard from multiple matches
   Body: { tournamentId, stageNumber, matchRoomIds[] }
*/
router.post("/generate", adminAuth, generateStageResults);

/* 🏆 Get Stage Leaderboard */
router.get("/:tournamentId/:stageNumber", adminAuth, getStageLeaderboard);

/* 🎯 Mark Qualified Teams
   Body: { tournamentId, stageNumber, qualifyCount }
*/
router.patch("/qualify", adminAuth, markStageQualified);

module.exports = router;
