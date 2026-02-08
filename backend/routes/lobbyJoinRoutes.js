const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");

const { joinTournamentLobby } = require("../controllers/lobbyJoinController");

/* =========================
   VALIDATION HELPER
========================= */
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

/* =======================================================
   🚀 TEAM JOIN TOURNAMENT (AUTO SLOT ASSIGN)
   POST /api/v1/lobby/join
======================================================= */
router.post(
  "/join",
  apiLimiter,
  auth,
  body("tournamentId").isMongoId(),
  body("teamId").isMongoId(),
  async (req, res, next) => {
    if (validate(req, res)) return;
    next();
  },
  joinTournamentLobby
);

module.exports = router;
