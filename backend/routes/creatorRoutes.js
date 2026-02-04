const express = require("express");
const router = express.Router();

const HotSlot = require("../models/HotSlot");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Tournament = require("../models/Tournament");

const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");

const { body, param, validationResult } = require("express-validator");

/* =========================
   HARD LOCKED CREATOR
========================= */
const CREATOR_EMAIL = "jarahul989@gmail.com";

/* =========================
   CENTRAL CREATOR GUARD (C3)
========================= */
const isCreator = (req, res, next) => {
  try {
    if (!req.user || req.user.email !== CREATOR_EMAIL) {
      return res.status(403).json({
        success: false,
        msg: "Creator access only",
      });
    }

    req.role = "creator";
    next();
  } catch (err) {
    console.error("Creator guard error:", err);
    res.status(500).json({
      success: false,
      msg: "Security failure",
    });
  }
};

/* =========================
   VALIDATION HANDLER
========================= */
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      msg: errors.array()[0].msg,
    });
    return true;
  }
  return false;
};

/* =========================
   VALIDATIONS
========================= */
const validateCreateAdmin = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name too short"),
  body("email").isEmail().withMessage("Invalid email"),
];

const validateRemoveAdmin = [
  param("email").isEmail().withMessage("Invalid email"),
];

/* Hot Slot can be WEBSITE or EXTERNAL */
const validateHotSlot = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Title too short"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Description too short"),

  body("tournament")
    .optional()
    .isMongoId()
    .withMessage("Invalid tournament ID"),

  body("prizePool")
    .isInt({ min: 0 })
    .withMessage("Invalid prize pool"),

  body("stage")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Stage too short"),

  body("slots")
    .isInt({ min: 1 })
    .withMessage("Invalid slot count"),

  body("contact")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Invalid contact"),
];

/* =========================
   CREATOR DASHBOARD STATS
========================= */
router.get("/stats", apiLimiter, auth, isCreator, async (req, res) => {
  try {
    const [totalUsers, admins, activeTournaments, hotSlots] =
      await Promise.all([
        User.countDocuments(),
        Admin.find().select("name email createdAt"),
        Tournament.countDocuments({ status: "upcoming" }),
        HotSlot.countDocuments(),
      ]);

    res.json({
      success: true,
      creator: CREATOR_EMAIL,
      totalUsers,
      activeTournaments,
      totalHotSlots: hotSlots,
      admins,
    });
  } catch (err) {
    console.error("Creator stats error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

/* =========================
   CREATE ADMIN
========================= */
router.post(
  "/create-admin",
  apiLimiter,
  auth,
  isCreator,
  validateCreateAdmin,
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const { name, email } = req.body;

      if (email.toLowerCase() === CREATOR_EMAIL) {
        return res.status(400).json({
          success: false,
          msg: "Creator cannot be admin",
        });
      }

      const exists = await Admin.findOne({ email });
      if (exists) {
        return res.status(400).json({
          success: false,
          msg: "Admin already exists",
        });
      }

      const admin = await Admin.create({ name, email });

      res.status(201).json({
        success: true,
        msg: "Admin created",
        admin,
      });
    } catch (err) {
      console.error("Create admin error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   REMOVE ADMIN
========================= */
router.delete(
  "/remove-admin/:email",
  apiLimiter,
  auth,
  isCreator,
  validateRemoveAdmin,
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const email = req.params.email.toLowerCase();

      if (email === CREATOR_EMAIL) {
        return res.status(400).json({
          success: false,
          msg: "Creator cannot be removed",
        });
      }

      const result = await Admin.deleteOne({ email });

      if (!result.deletedCount) {
        return res.status(404).json({
          success: false,
          msg: "Admin not found",
        });
      }

      res.json({ success: true, msg: "Admin removed" });
    } catch (err) {
      console.error("Remove admin error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   POST HOT SLOT (PROMO)
========================= */
router.post(
  "/hot-slot",
  apiLimiter,
  auth,
  isCreator,
  validateHotSlot,
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const {
        tournament,
        title,
        description,
        prizePool,
        stage,
        slots,
        contact,
      } = req.body;

      let tournamentRef = null;

      if (tournament) {
        const exists = await Tournament.findById(tournament);
        if (!exists) {
          return res
            .status(404)
            .json({ success: false, msg: "Tournament not found" });
        }
        tournamentRef = tournament;
      }

      const slot = await HotSlot.create({
        tournament: tournamentRef,
        title: title || "External Tournament",
        description: description || "Promotional hot slot",
        prizePool,
        stage,
        slots,
        contact: `DM FOR DETAILS - ${contact}`,
        createdBy: CREATOR_EMAIL,
      });

      res.status(201).json({
        success: true,
        msg: "Hot slot posted",
        slot,
      });
    } catch (err) {
      console.error("Hot slot error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
