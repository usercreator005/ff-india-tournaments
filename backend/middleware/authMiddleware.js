const admin = require("../config/firebaseAdmin");
const User = require("../models/User");
const Admin = require("../models/Admin");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);

    if (!decoded || !decoded.email) {
      return res.status(401).json({ message: "Invalid Firebase token" });
    }

    const email = decoded.email.toLowerCase();
    let role = "user";

    /* =========================
       ROLE DETECTION
    ========================= */

    // Creator (highest priority)
    if (
      process.env.CREATOR_EMAIL &&
      email === process.env.CREATOR_EMAIL.toLowerCase()
    ) {
      role = "creator";
    }
    // Admin
    else {
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
        role
      });
    } else if (user.role !== role) {
      // Auto role sync
      user.role = role;
      await user.save();
    }

    /* =========================
       REQUEST ATTACH
    ========================= */
    req.user = {
      uid: decoded.uid,
      email,
      name: decoded.name || user.name
    };

    req.role = role;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(403).json({ message: "Authentication failed" });
  }
};

module.exports = authMiddleware;
