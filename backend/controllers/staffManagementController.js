const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");

/* =======================================================
   ➕ CREATE STAFF (ADMIN)
======================================================= */
exports.createStaff = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { name, email, password, role, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }

    const existing = await Staff.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Staff with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await Staff.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      permissions,
      adminId,
    });

    res.status(201).json({ success: true, staff });
  } catch (err) {
    console.error("Create staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   📋 GET ALL STAFF UNDER ADMIN
======================================================= */
exports.getAllStaff = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const staffList = await Staff.find({ adminId }).select("-password");

    res.json({ success: true, staff: staffList });
  } catch (err) {
    console.error("Fetch staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   ✏️ UPDATE STAFF DETAILS / PERMISSIONS
======================================================= */
exports.updateStaff = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { staffId } = req.params;
    const { name, role, permissions, isActive } = req.body;

    const staff = await Staff.findOne({ _id: staffId, adminId });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (name !== undefined) staff.name = name;
    if (role !== undefined) staff.role = role;
    if (permissions !== undefined) staff.permissions = permissions;
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    res.json({ success: true, staff });
  } catch (err) {
    console.error("Update staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   ❌ DELETE STAFF (SOFT DELETE → deactivate)
======================================================= */
exports.deactivateStaff = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { staffId } = req.params;

    const staff = await Staff.findOne({ _id: staffId, adminId });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    staff.isActive = false;
    await staff.save();

    res.json({ success: true, message: "Staff deactivated" });
  } catch (err) {
    console.error("Deactivate staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
