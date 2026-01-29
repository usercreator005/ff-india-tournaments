const express = require("express");
const router = express.Router();
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { body, param, validationResult } = require("express-validator");

/* =========================
   VALIDATION HELPERS
========================= */
const validateCreateTournament = [
  body("name").trim().isLength({ min: 3 }),
  body("slots").isInt({ min: 1 }),
  body("prizePool").trim().notEmpty(),
  body("entryType").isIn(["free", "paid"]),
  body("entryFee").optional().isInt({ min: 0 }),
  body("upiId").optional().isString().trim(),
];

const validateStatusParam = [
  param("id").isMongoId(),
  body("status").isIn(["upcoming", "ongoing", "past"]),
];

const validateErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

/* =========================
   CREATE TOURNAMENT (ADMIN)
========================= */
router.post(
  "/create",
  apiLimiter,
  auth,
  validateCreateTournament,
  async (req, res) => {
    try {
      if (req.role !== "admin") {
        return res.status(403).json({ msg: "Only admin allowed" });
      }

      if (validateErrors(req, res)) return;

      const {
        name,
        slots,
        prizePool,
        entryType,
        entryFee,
        upiId,
        qrImage,
      } = req.body;

      if (entryType === "paid" && !upiId) {
        return res.status(400).json({
          msg: "UPI ID required for paid tournament",
        });
      }

      const tournament = await Tournament.create({
        name,
        slots,
        prizePool,
        entryType,
        entryFee: entryType === "paid" ? entryFee : 0,
        payment:
          entryType === "paid"
            ? { upiId, qrImage }
            : undefined,
        status: "upcoming",
        createdBy: req.user.email,
      });

      res.status(201).json({
        msg: "Tournament created successfully",
        tournament,
      });
    } catch (err) {
      console.error("Create tournament error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

/* =========================
   UPDATE TOURNAMENT STATUS
========================= */
router.patch(
  "/status/:id",
  apiLimiter,
  auth,
  validateStatusParam,
  async (req, res) => {
    try {
      if (req.role !== "admin") {
        return res.status(403).json({ msg: "Only admin allowed" });
      }

      if (validateErrors(req, res)) return;

      const tournament = await Tournament.findById(req.params.id);
      if (!tournament) {
        return res.status(404).json({ msg: "Tournament not found" });
      }

      tournament.status = req.body.status;
      await tournament.save();

      res.json({ msg: "Status updated", tournament });
    } catch (err) {
      console.error("Update status error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

/* =========================
   FETCH TOURNAMENTS (PUBLIC)
========================= */
router.get("/public/:status", apiLimiter, async (req, res) => {
  try {
    const allowed = ["upcoming", "ongoing", "past"];
    if (!allowed.includes(req.params.status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const tournaments = await Tournament.find({
      status: req.params.status,
    }).sort({ createdAt: -1 });

    res.json(tournaments);
  } catch (err) {
    console.error("Public fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   FETCH TOURNAMENTS (ADMIN)
========================= */
router.get("/admin/:status", apiLimiter, auth, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ msg: "Only admin access" });
    }

    const allowed = ["upcoming", "ongoing", "past"];
    if (!allowed.includes(req.params.status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const tournaments = await Tournament.find({
      status: req.params.status,
    }).sort({ createdAt: -1 });

    res.json(tournaments);
  } catch (err) {
    console.error("Admin fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
