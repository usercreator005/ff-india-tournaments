const admin = require("../config/firebaseAdmin");
const User = require("../models/User");
const Admin = require("../models/Admin");

/**
 * ============================
 * HARD LOCKED CREATOR CONFIG
 * ============================
 * ⚠️ DO NOT CHANGE
 * Only ONE creator allowed permanently
 */
const CREATOR_EMAIL = "jarahul989@gmail.com";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    /* =========================
       TOKEN CHECK
    ========================= */
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

    if (!decoded || !decoded.email) {
      return res.status(401).json({
        success: false,
        msg: "Invalid Firebase token",
      });
    }

    const email = decoded.email.toLowerCase();
    let role = "user";

    /* =========================
       ROLE DETECTION (SECURE)
    ========================= */

    // 🔒 CREATOR: HARD LOCK (EMAIL ONLY)
    if (email === CREATOR_EMAIL) {
      role = "creator";
    } else {
      // ADMIN CHECK (DB BASED)
      const isAdmin = await Admin.findOne({ email });
      if (isAdmin) {
        role = "admin";
      }
    }

    /* =========================
       USER SYNC (AUTO & SAFE)
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
      /**
       * 🚨 SECURITY RULE
       * - Creator role can NEVER be assigned to anyone else
       * - Even if DB is manipulated
       */
      if (user.role === "creator" && email !== CREATOR_EMAIL) {
        return res.status(403).json({
          success: false,
          msg: "Creator access forbidden",
        });
      }

      if (user.role !== role) {
        user.role = role;
        await user.save();
      }
    }

    /* =========================
       ATTACH REQUEST DATA
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
