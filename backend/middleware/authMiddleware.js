const admin = require("../config/firebaseAdmin");
const User = require("../models/User");
const Admin = require("../models/Admin");

/**
 * ============================
 * 🔒 HARD LOCKED CREATOR
 * ============================
 * Only this email can EVER be SUPER ADMIN
 */
const CREATOR_EMAIL = "jarahul989@gmail.com".toLowerCase();

const authMiddleware = async (req, res, next) => {
  try {
    /* =========================
       AUTH HEADER CHECK
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

    const email = decoded.email.toLowerCase().trim();

    /* =========================
       ROLE RESOLUTION (SOURCE OF TRUTH)
    ========================= */
    let role = "user";
    let adminDoc = null;

    // 👑 CREATOR → SUPER ADMIN
    if (email === CREATOR_EMAIL) {
      role = "SUPER_ADMIN";
    } else {
      // 🧑‍💼 ADMIN (DB BASED)
      adminDoc = await Admin.findOne({ email, isActive: true });
      if (adminDoc) role = "ADMIN";
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
        role: role === "ADMIN" ? "admin" : "user",
      });
    } else {
      // Prevent privilege escalation via DB tampering
      if (user.role === "creator" && email !== CREATOR_EMAIL) {
        return res.status(403).json({
          success: false,
          msg: "Creator role forbidden",
        });
      }

      const expectedUserRole =
        role === "SUPER_ADMIN" ? "creator" :
        role === "ADMIN" ? "admin" : "user";

      if (user.role !== expectedUserRole) {
        user.role = expectedUserRole;
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

    req.userId = user._id;
    req.role = role;

    /* =========================
       🔐 ADMIN DATA ISOLATION
       (PHASE 1 CORE RULE)
    ========================= */
    if (role === "ADMIN") {
      req.adminId = adminDoc._id;      // 🔑 MAIN DATA BOUNDARY
      req.orgName = adminDoc.orgName;  // 🎨 Branding only
    }

    /* =========================
       👑 SUPER ADMIN BYPASS
    ========================= */
    if (role === "SUPER_ADMIN") {
      req.isSuperAdmin = true;
    }

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
