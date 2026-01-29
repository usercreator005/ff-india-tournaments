const express = require("express");
const router = express.Router();

const HotSlot = require("../models/HotSlot");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { body, param } = require("express-validator");
const { validationResult } = require("express-validator");

/* =========================
   VALIDATION HELPERS
========================= */
const validateCreateAdmin = [
  body("name").trim().isLength({ min: 2 }),
  body("email").isEmail(),
];

const validateRemoveAdmin = [
  param("email").isEmail(),
];

const validateHotSlot = [
  body("tournament").isMongoId(),
  body("prizePool").isInt({ min: 0 }),
  body("stage").trim().isLength({ min: 2 }),
  body("slots").isInt({ min: 1 }),
  body("contact").trim().isLength({ min: 3 }),
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
   CREATOR DASHBOARD STATS
========================= */
router.get("/stats", apiLimiter, auth, async (req, res) => {
  try {
    if (req.role !== "creator") {
      return res.sendStatus(403);
    }

    const totalUsers = await User.countDocuments();
    const admins = await Admin.find().select("-__v");
    const activeTournaments = await Tournament.countDocuments({
      status: "upcoming",
    });

    res.json({
      totalUsers,
      activeTournaments,
      admins,
    });
  } catch (err) {
    console.error("Creator stats error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   CREATE ADMIN (CREATOR ONLY)
========================= */
router.post(
  "/create-admin",
  apiLimiter,
  auth,
  validateCreateAdmin,
  async (req, res) => {
    try {
      if (req.role !== "creator") {
        return res.sendStatus(403);
      }

      if (validateErrors(req, res)) return;

      const { name, email } = req.body;

      const exists = await Admin.findOne({ email });
      if (exists) {
        return res.status(400).json({ msg: "Admin already exists" });
      }

      const admin = await Admin.create({ name, email });

      res.status(201).json({
        msg: "Admin created successfully",
        admin,
      });
    } catch (err) {
      console.error("Create admin error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

/* =========================
   REMOVE ADMIN (CREATOR ONLY)
========================= */
router.delete(
  "/remove-admin/:email",
  apiLimiter,
  auth,
  validateRemoveAdmin,
  async (req, res) => {
    try {
      if (req.role !== "creator") {
        return res.sendStatus(403);
      }

      if (validateErrors(req, res)) return;

      if (req.params.email === req.user.email) {
        return res.status(400).json({ msg: "Cannot remove yourself" });
      }

      const result = await Admin.deleteOne({ email: req.params.email });

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: "Admin not found" });
      }

      res.json({ msg: "Admin removed successfully" });
    } catch (err) {
      console.error("Remove admin error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

/* =========================
   POST HOT SLOT (CREATOR ONLY)
========================= */
router.post(
  "/hot-slot",
  apiLimiter,
  auth,
  validateHotSlot,
  async (req, res) => {
    try {
      if (req.role !== "creator") {
        return res.sendStatus(403);
      }

      if (validateErrors(req, res)) return;

      const { tournament, prizePool, stage, slots, contact } = req.body;

      const slot = await HotSlot.create({
        tournament,
        prizePool,
        stage,
        slots,
        contact: `DM ME FOR DETAILS - ${contact}`,
      });

      res.status(201).json({
        msg: "Hot slot posted successfully",
        slot,
      });
    } catch (err) {
      console.error("Hot slot error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

module.exports = router;
