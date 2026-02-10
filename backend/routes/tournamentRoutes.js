const express = require("express");
const router = express.Router();
const Tournament = require("../models/Tournament");
const PaymentProof = require("../models/PaymentProof");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { body, param, validationResult } = require("express-validator");

const adminAuth = require("../middleware/adminAuth");
const { verifyStaff } = require("../middleware/staffAuth");

/* 🔔 PHASE 7 REMINDER SERVICE */
const {
  scheduleMatchStartReminder,
  rescheduleMatchStartReminder,
} = require("../services/reminderService");

/* =======================================================
   🔐 ADMIN OR TOURNAMENT STAFF ACCESS
   ✅ Admin (full)
   ✅ Staff with canManageTournaments
======================================================= */
const adminOrTournamentStaff = async (req, res, next) => {
  try {
    // Try Admin first
    await new Promise((resolve, reject) => {
      adminAuth(req, res, (err) => (err ? reject(err) : resolve()));
    });

    if (req.admin) return next();
  } catch (e) {
    // Not admin, continue
  }

  try {
    // Try Staff
    await new Promise((resolve, reject) => {
      verifyStaff(req, res, (err) => (err ? reject(err) : resolve()));
    });

    if (req.staff?.permissions?.canManageTournaments) return next();

    return res.status(403).json({ success: false, msg: "Access denied" });
  } catch (err) {
    return res.status(401).json({ success: false, msg: "Unauthorized" });
  }
};

/* =========================
   HELPERS
========================= */
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

/* =========================
   VALIDATIONS
========================= */
const validateCreateTournament = [
  body("name").trim().isLength({ min: 3 }),
  body("game").trim().notEmpty(),
  body("mode").trim().notEmpty(),
  body("map").trim().notEmpty(),
  body("startTime").isISO8601(),
  body("slots").isInt({ min: 1 }),
  body("prizePool").notEmpty(),
  body("entryType").isIn(["free", "paid"]),
  body("entryFee").optional().isInt({ min: 0 }),
  body("upiId").optional().isString().trim(),
];

const validateStatusParam = [
  param("id").isMongoId(),
  body("status").isIn(["upcoming", "ongoing", "past", "cancelled"]),
];

const validateEditTournament = [
  param("id").isMongoId(),
  body("name").optional().trim().isLength({ min: 3 }),
  body("game").optional().trim().notEmpty(),
  body("mode").optional().trim().notEmpty(),
  body("map").optional().trim().notEmpty(),
  body("startTime").optional().isISO8601(),
  body("slots").optional().isInt({ min: 1 }),
  body("prizePool").optional().notEmpty(),
  body("entryType").optional().isIn(["free", "paid"]),
  body("entryFee").optional().isInt({ min: 0 }),
  body("upiId").optional().isString().trim(),
  body("qrImage").optional().isString(),
];

/* =========================
   CREATE TOURNAMENT
========================= */
router.post(
  "/create",
  apiLimiter,
  auth,
  adminOrTournamentStaff,
  validateCreateTournament,
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const {
        name, game, mode, map, startTime, slots,
        prizePool, entryType, entryFee = 0, upiId, qrImage,
      } = req.body;

      if (entryType === "paid" && (!upiId || entryFee <= 0)) {
        return res.status(400).json({
          success: false,
          msg: "Paid tournament requires UPI ID and entry fee",
        });
      }

      const adminId = req.admin?._id || req.staff?.adminId;

      const tournament = await Tournament.create({
        name,
        game,
        mode,
        map,
        startTime,
        slots,
        prizePool,
        entryType,
        entryFee: entryType === "paid" ? entryFee : 0,
        upiId: entryType === "paid" ? upiId : null,
        qrImage: entryType === "paid" ? qrImage || null : null,
        status: "upcoming",
        adminId,
      });

      await scheduleMatchStartReminder(tournament);

      res.status(201).json({ success: true, msg: "Tournament created", tournament });
    } catch (err) {
      console.error("Create tournament error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   EDIT TOURNAMENT
========================= */
router.patch(
  "/edit/:id",
  apiLimiter,
  auth,
  adminOrTournamentStaff,
  validateEditTournament,
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const adminId = req.admin?._id || req.staff?.adminId;

      const tournament = await Tournament.findOne({ _id: req.params.id, adminId });
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      const oldStartTime = tournament.startTime;

      delete req.body.adminId;
      delete req.body.filledSlots;
      delete req.body.players;
      delete req.body.status;

      Object.assign(tournament, req.body);
      await tournament.save();

      if (req.body.startTime &&
        new Date(req.body.startTime).getTime() !== new Date(oldStartTime).getTime()) {
        await rescheduleMatchStartReminder(tournament);
      }

      res.json({ success: true, msg: "Tournament updated", tournament });
    } catch (err) {
      console.error("Edit tournament error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   UPDATE STATUS
========================= */
router.patch(
  "/status/:id",
  apiLimiter,
  auth,
  adminOrTournamentStaff,
  validateStatusParam,
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const adminId = req.admin?._id || req.staff?.adminId;

      const tournament = await Tournament.findOne({ _id: req.params.id, adminId });
      if (!tournament) return res.status(404).json({ success: false, msg: "Not found" });

      tournament.status = req.body.status;
      await tournament.save();

      res.json({ success: true, msg: "Status updated", tournament });
    } catch (err) {
      console.error("Status update error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   JOIN TOURNAMENT (USER ONLY)
========================= */
router.post("/join/:id", apiLimiter, auth, param("id").isMongoId(), async (req, res) => {
  try {
    if (validate(req, res)) return;
    if (req.role !== "user") return res.status(403).json({ success: false, msg: "Only users allowed" });

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, msg: "Tournament not found" });
    if (tournament.status !== "upcoming") return res.status(400).json({ success: false, msg: "Not open" });
    if (tournament.players.includes(req.user.email)) return res.status(400).json({ success: false, msg: "Already joined" });
    if (tournament.filledSlots >= tournament.slots) return res.status(400).json({ success: false, msg: "Slots full" });

    if (tournament.entryType === "paid") {
      const proof = await PaymentProof.findOne({
        tournamentId: tournament._id,
        userEmail: req.user.email,
        status: "approved",
      });
      if (!proof) return res.status(402).json({ success: false, msg: "Payment not verified" });
    }

    await Tournament.updateOne(
      { _id: tournament._id },
      { $addToSet: { players: req.user.email }, $inc: { filledSlots: 1 } }
    );

    res.json({ success: true, msg: "Successfully joined tournament" });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

/* =========================
   USER + PUBLIC ROUTES
========================= */
router.get("/my", apiLimiter, auth, async (req, res) => {
  if (req.role !== "user") return res.status(403).json({ success: false });
  const tournaments = await Tournament.find({ players: req.user.email }).sort({ startTime: 1 });
  res.json({ success: true, tournaments });
});

router.get("/public/:status", apiLimiter, async (req, res) => {
  const tournaments = await Tournament.find({ status: req.params.status }).sort({ startTime: 1 });
  res.json({ success: true, tournaments });
});

router.get("/admin/:status", apiLimiter, auth, adminOrTournamentStaff, async (req, res) => {
  const adminId = req.admin?._id || req.staff?.adminId;
  const tournaments = await Tournament.find({ status: req.params.status, adminId }).sort({ startTime: 1 });
  res.json({ success: true, tournaments });
});

module.exports = router;
