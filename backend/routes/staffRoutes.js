const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");
const bcrypt = require("bcryptjs");

const { verifyStaff } = require("../middleware/staffAuth");

/* =======================================================
   👤 STAFF LOGIN
   Generates JWT for staff panel access
======================================================= */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Normalize email
    email = email.toLowerCase().trim();

    const staff = await Staff.findOne({ email }).select("+password");

    // Generic message to prevent account probing
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
});

/* =======================================================
   🙋 GET STAFF PROFILE (AUTH REQUIRED)
======================================================= */
router.get("/me", verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staff._id).select("-password");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json({ success: true, staff });
  } catch (err) {
    console.error("Fetch staff profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
