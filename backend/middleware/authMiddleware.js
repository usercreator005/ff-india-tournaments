const admin = require("../config/firebaseAdmin");
const User = require("../models/User");
const Admin = require("../models/Admin");

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
       ROLE DETECTION
    ========================= */
    if (
      process.env.CREATOR_EMAIL &&
      email === process.env.CREATOR_EMAIL.toLowerCase()
    ) {
      role = "creator";
    } else {
      const isAdmin = await Admin.findOne({ email });
      if (isAdmin) role = "admin";
    }

    /* =========================
       USER SYNC (AUTO)
    ========================= */
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        uid: decoded.uid,
        name: decoded.name || "Player",
        email,
        role,
      });
    } else if (user.role !== role) {
      user.role = role;
      await user.save();
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
