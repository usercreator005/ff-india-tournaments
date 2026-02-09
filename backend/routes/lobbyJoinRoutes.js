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
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
};

/* =======================================================
   🚀 TEAM JOIN TOURNAMENT (AUTO SLOT ASSIGN)
   Player joins lobby — slot handled in controller
   POST /api/v1/lobby/join
======================================================= */
router.post(
  "/join",
  apiLimiter,
  auth,

  // ✅ Input validation
  body("tournamentId")
    .isMongoId()
    .withMessage("Valid tournamentId is required"),

  body("teamId")
    .isMongoId()
    .withMessage("Valid teamId is required"),

  async (req, res, next) => {
    const errorResponse = validate(req, res);
    if (errorResponse) return errorResponse;
    next();
  },

  // 🎯 Main Controller
  joinTournamentLobby
);

module.exports = router;
