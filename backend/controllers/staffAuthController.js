const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");

/* =======================================================
   👤 STAFF LOGIN
   Staff logs in using email + password
======================================================= */
exports.staffLogin = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Normalize email
    email = email.toLowerCase().trim();

    const staff = await Staff.findOne({ email }).select("+password");

    // Generic response to avoid email probing
    if (!staff || !staff.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: staff._id,
        role: "staff",
        adminId: staff.adminId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        permissions: staff.permissions,
      },
    });
  } catch (err) {
    console.error("Staff login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
