const admin = require("../config/firebaseAdmin");
const User = require("../models/User");
const Admin = require("../models/Admin");

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;

    let user = await User.findOne({ email: decoded.email });

    if (!user) {
      let role = "user";

      if (decoded.email === process.env.CREATOR_EMAIL) {
        role = "creator";
      } else if (await Admin.findOne({ email: decoded.email })) {
        role = "admin";
      }

      user = await User.create({
        uid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        role
      });
    }

    req.role = user.role;
    next();

  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
