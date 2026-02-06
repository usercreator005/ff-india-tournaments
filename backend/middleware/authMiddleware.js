// backend/middleware/authMiddleware.js
// PHASE 1 – HARDENED AUTH MIDDLEWARE
// Firebase Token Verify • Single Creator Lock • DB Admins • Safe User Sync

const admin = require("../config/firebaseAdmin");
const User = require("../models/User");
const Admin = require("../models/Admin");

/**
 * ============================
 * 🔒 HARD LOCKED CREATOR
 * ============================
 * Only this email can EVER be creator
 */
const CREATOR_EMAIL = "jarahul989@gmail.com".toLowerCase();

const authMiddleware = async (req, res, next) => {
  try {
    /* =========================
       AUTH HEADER
    ========================= */
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        msg: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    /* =========================
       VERIFY FIREBASE TOKEN
    ========================= */
    const decoded = await admin.auth().verifyIdToken(token);

    if (!decoded?.email) {
      return res.status(401).json({
        success: false,
        msg: "Invalid Firebase token",
      });
    }

    const email = decoded.email.toLowerCase();

    /* =========================
       ROLE RESOLUTION (SOURCE OF TRUTH)
    ========================= */
    let role = "user";

    // 🔒 CREATOR (EMAIL ONLY, DB CAN'T OVERRIDE)
    if (email === CREATOR_EMAIL) {
      role = "creator";
    } else {
      // ADMIN (DB BASED)
      const isAdmin = await Admin.findOne({ email }).lean();
      if (isAdmin) role = "admin";
    }

    /* =========================
       USER SYNC (SAFE)
    ========================= */
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        uid: decoded.uid,
        name: decoded.name || "Player",
        email,
        role,
      });
    } else {
      // 🚨 SECURITY GUARANTEE
      // DB can NEVER assign creator to anyone else
      if (user.role === "creator" && email !== CREATOR_EMAIL) {
        return res.status(403).json({
          success: false,
          msg: "Creator role forbidden",
        });
      }

      // Sync role if needed (except creator lock)
      if (user.role !== role) {
        user.role = role;
        await user.save();
      }
    }

    /* =========================
       REQUEST CONTEXT
    ========================= */
    req.user = {
      uid: decoded.uid,
      email,
      name: decoded.name || user.name,
    };

    req.role = role;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    return res.status(401).json({
      success: false,
      msg: "Authentication failed or token expired",
    });
  }
};

module.exports = authMiddleware;
