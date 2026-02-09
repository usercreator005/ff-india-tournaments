const express = require("express");
const router = express.Router();

const {
  generateStageResults,
  getStageLeaderboard,
  markStageQualified,
} = require("../controllers/stageResultController");

const adminAuth = require("../middleware/adminAuth");
const { verifyStaff } = require("../middleware/staffAuth");

/* =======================================================
   🔐 ADMIN OR STAFF (RESULT MANAGER) ACCESS
======================================================= */
const adminOrResultStaff = async (req, res, next) => {
  adminAuth(req, res, async (adminErr) => {
    if (!adminErr && req.admin) {
      return next(); // Admin allowed
    }

    verifyStaff(req, res, () => {
      if (req.staff?.permissions?.canManageResults) {
        return next(); // Staff with result permission allowed
      }
      return res.status(403).json({ message: "Access denied" });
    });
  });
};

/* =======================================================
   🎯 PHASE 9 — STAGE RESULT MANAGEMENT
   Base Path: /api/v1/stage-results
   Admin + Result Staff access
======================================================= */

/* 📊 Generate Stage Leaderboard from multiple matches */
router.post("/generate", adminOrResultStaff, generateStageResults);

/* 🏆 Get Stage Leaderboard for a Stage */
router.get(
  "/:tournamentId/stage/:stageNumber",
  adminOrResultStaff,
  getStageLeaderboard
);

/* 🎯 Mark Qualified Teams */
router.patch("/qualify", adminOrResultStaff, markStageQualified);

module.exports = router;
