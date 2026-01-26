const admin = require("../config/firebaseAdmin");
const User = require("../models/User");
const Admin = require("../models/Admin");

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;

    let role = "user";

    // Creator check
    if (decoded.email === process.env.CREATOR_EMAIL) {
      role = "creator";
    }
    // Admin check
    else if (await Admin.findOne({ email: decoded.email })) {
      role = "admin";
    }

    let user = await User.findOne({ email: decoded.email });

    if (!user) {
      user = await User.create({
        uid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        role
      });
    } else if (user.role !== role) {
      // 🔥 AUTO SYNC ROLE
      user.role = role;
      await user.save();
    }

    req.role = role;
    next();

  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
