const express = require("express");
const router = express.Router();
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { body, param, validationResult } = require("express-validator");

/* =========================
   HELPERS
========================= */
const adminOnly = (req, res, next) => {
  if (req.role !== "admin") {
    return res.status(403).json({ success: false, msg: "Admin only" });
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

/* =========================
   VALIDATIONS
========================= */
const validateCreateTournament = [
  body("name").trim().isLength({ min: 3 }),
  body("slots").isInt({ min: 1 }),
  body("prizePool").notEmpty(),
  body("entryType").isIn(["free", "paid"]),
  body("entryFee").optional().isInt({ min: 0 }),
  body("upiId").optional().isString().trim()
];

const validateStatusParam = [
  param("id").isMongoId(),
  body("status").isIn(["upcoming", "ongoing", "past"])
];

/* =========================
   CREATE TOURNAMENT (ADMIN)
========================= */
router.post(
  "/create",
  apiLimiter,
  auth,
  adminOnly,
  validateCreateTournament,
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const {
        name,
        slots,
        prizePool,
        entryType,
        entryFee = 0,
        upiId,
        qrImage
      } = req.body;

      if (entryType === "paid") {
        if (!upiId || entryFee <= 0) {
          return res.status(400).json({
            success: false,
            msg: "Paid tournament requires UPI ID and entry fee"
          });
        }
      }

      const tournament = await Tournament.create({
        name,
        slots,
        prizePool,
        entryType,
        entryFee: entryType === "paid" ? entryFee : 0,
        upiId: entryType === "paid" ? upiId : null,
        qrImage: entryType === "paid" ? qrImage || null : null,
        status: "upcoming",
        createdBy: req.user.email
      });

      res.status(201).json({
        success: true,
        msg: "Tournament created",
        tournament
      });
    } catch (err) {
      console.error("Create tournament error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   UPDATE STATUS (ADMIN)
========================= */
router.patch(
  "/status/:id",
  apiLimiter,
  auth,
  adminOnly,
  validateStatusParam,
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const tournament = await Tournament.findById(req.params.id);
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Not found" });
      }

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
   MY TOURNAMENTS (USER)
========================= */
router.get("/my", apiLimiter, auth, async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({
        success: false,
        msg: "Only users can access their tournaments"
      });
    }

    const tournaments = await Tournament.find({
      players: req.user.email
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      tournaments
    });
  } catch (err) {
    console.error("My tournaments error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

/* =========================
   FETCH PUBLIC TOURNAMENTS
========================= */
router.get("/public/:status", apiLimiter, async (req, res) => {
  try {
    const allowed = ["upcoming", "ongoing", "past"];
    if (!allowed.includes(req.params.status)) {
      return res.status(400).json({ success: false, msg: "Invalid status" });
    }

    const tournaments = await Tournament.find({
      status: req.params.status
    }).sort({ createdAt: -1 });

    res.json({ success: true, tournaments });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

/* =========================
   FETCH ADMIN TOURNAMENTS
========================= */
router.get(
  "/admin/:status",
  apiLimiter,
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const allowed = ["upcoming", "ongoing", "past"];
      if (!allowed.includes(req.params.status)) {
        return res.status(400).json({ success: false, msg: "Invalid status" });
      }

      const tournaments = await Tournament.find({
        status: req.params.status
      }).sort({ createdAt: -1 });

      // ✅ frontend compatible
      res.json({ success: true, tournaments });
    } catch (err) {
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
