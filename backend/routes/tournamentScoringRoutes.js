const express = require("express");
const router = express.Router();

const {
  setTournamentScoring,
  getTournamentScoring,
} = require("../controllers/tournamentScoringController");

const adminAuth = require("../middleware/adminAuth");

/* =======================================================
   🎯 TOURNAMENT SCORING RULES (PHASE 8)
   Base: /api/v1/scoring
======================================================= */

router.post("/", adminAuth, setTournamentScoring);
router.get("/:tournamentId", adminAuth, getTournamentScoring);

module.exports = router;
