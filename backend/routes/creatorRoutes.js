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
   CENTRAL CREATOR GUARD
========================= */
const isCreator = (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    if (req.user.email !== CREATOR_EMAIL) {
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
      msg: "Security check failed",
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

/* 🔥 FIXED: prizePool OPTIONAL */
const validateHotSlot = [
  body("title").optional().trim().isLength({ min: 3 }),
  body("description").optional().trim().isLength({ min: 5 }),
  body("tournament").optional().isMongoId(),

  body("prizePool")
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage("Invalid prize pool"),

  body("stage").trim().isLength({ min: 2 }).withMessage("Stage too short"),

  body("slots")
    .trim()
    .isLength({ min: 5 })
    .withMessage("Slot details required"),

  body("contact").trim().isLength({ min: 3 }).withMessage("Invalid contact"),
];

/* =========================
   CREATOR DASHBOARD STATS
========================= */
router.get("/stats", apiLimiter, auth, isCreator, async (req, res) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      admins,
      activeTournaments,
      activeHotSlots,
      totalHotSlots,
    ] = await Promise.all([
      User.countDocuments(),
      Admin.find().select("name email createdAt"),
      Tournament.countDocuments({ status: "upcoming" }),
      HotSlot.countDocuments({
        createdBy: CREATOR_EMAIL,
        expiresAt: { $gt: now },
      }),
      HotSlot.countDocuments({ createdBy: CREATOR_EMAIL }),
    ]);

    res.json({
      success: true,
      creator: CREATOR_EMAIL,
      totalUsers,
      activeTournaments,
      activeHotSlots,
      totalHotSlots,
      admins,
    });
  } catch (err) {
    console.error("Creator stats error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
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

      const name = req.body.name.trim();
      const email = req.body.email.toLowerCase();

      if (email === CREATOR_EMAIL) {
        return res.status(400).json({
          success: false,
          msg: "Creator cannot be added as admin",
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
        msg: "Admin created successfully",
        admin,
      });
    } catch (err) {
      console.error("Create admin error:", err);
      res.status(500).json({
        success: false,
        msg: "Server error",
      });
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

      res.json({
        success: true,
        msg: "Admin removed successfully",
      });
    } catch (err) {
      console.error("Remove admin error:", err);
      res.status(500).json({
        success: false,
        msg: "Server error",
      });
    }
  }
);

/* =========================
   POST HOT SLOT (AUTO 24H EXPIRY)
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

      let {
        tournament,
        title,
        description,
        prizePool,
        stage,
        slots,
        contact,
      } = req.body;

      // ✅ DEFAULT PRIZE POOL
      prizePool = prizePool ? Number(prizePool) : 0;

      let tournamentRef = null;

      if (tournament) {
        const exists = await Tournament.findById(tournament);
        if (!exists) {
          return res.status(404).json({
            success: false,
            msg: "Tournament not found",
          });
        }
        tournamentRef = tournament;
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const slot = await HotSlot.create({
        tournament: tournamentRef,
        title: title || "External Tournament",
        description: description || "Promotional Hot Slot",
        prizePool,
        stage,
        slots,
        contact: `DM ME FOR DETAILS - ${contact}`,
        createdBy: CREATOR_EMAIL,
        expiresAt,
      });

      res.status(201).json({
        success: true,
        msg: "Hot slot posted (valid for 24 hours)",
        slot,
      });
    } catch (err) {
      console.error("Hot slot error:", err);
      res.status(500).json({
        success: false,
        msg: "Server error",
      });
    }
  }
);

/* =========================
   CREATOR HOT SLOT ANALYTICS
========================= */
router.get("/hot-slots", apiLimiter, auth, isCreator, async (req, res) => {
  try {
    const now = new Date();

    const slots = await HotSlot.find({ createdBy: CREATOR_EMAIL })
      .sort({ createdAt: -1 })
      .select(
        "title prizePool stage slots views whatsappClicks createdAt expiresAt"
      );

    const data = slots.map((s) => ({
      id: s._id,
      title: s.title,
      prizePool: s.prizePool,
      stage: s.stage,
      slots: s.slots,
      views: s.views,
      whatsappClicks: s.whatsappClicks,
      createdAt: s.createdAt,
      expired: s.expiresAt < now,
    }));

    res.json({
      success: true,
      total: data.length,
      slots: data,
    });
  } catch (err) {
    console.error("Hot slot analytics error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
});

module.exports = router;
