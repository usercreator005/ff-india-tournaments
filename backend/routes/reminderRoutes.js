const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { sendManualReminder } = require("../services/reminderScheduler");

/* =========================
   HELPERS
========================= */
const adminOrStaff = (req, res, next) => {
  // Staff system comes in Phase 10, but keeping future-safe
  if (req.role !== "admin" && !req.isSuperAdmin && req.role !== "staff") {
    return res.status(403).json({ success: false, msg: "Admin/Staff only" });
  }
  next();
};

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

/* =======================================================
   🔔 SEND MANUAL REMINDER
   POST /api/reminders/send
   Body: { tournamentId, type }
   type = "match_starting" | "room_live"
======================================================= */
router.post(
  "/send",
  apiLimiter,
  auth,
  adminOrStaff,
  body("tournamentId").isMongoId(),
  body("type").isIn(["match_starting", "room_live"]),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const { tournamentId, type } = req.body;

      const result = await sendManualReminder({
        tournamentId,
        adminId: req.adminId,
        type,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          msg: result.error || "Failed to send reminder",
        });
      }

      res.json({
        success: true,
        msg: "Reminder sent successfully",
        notifiedUsers: result.recipients,
      });
    } catch (err) {
      console.error("Send reminder route error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
