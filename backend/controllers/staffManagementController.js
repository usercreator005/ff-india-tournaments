const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");

/* =======================================================
   🧠 HELPER — DEFAULT PERMISSIONS BY ROLE
======================================================= */
const getDefaultPermissions = (role) => {
  switch (role) {
    case "tournament_manager":
      return {
        canManageResults: false,
        canManageTournaments: true,
        canHandleSupport: false,
      };
    case "support_staff":
      return {
        canManageResults: false,
        canManageTournaments: false,
        canHandleSupport: true,
      };
    case "result_manager":
    default:
      return {
        canManageResults: true,
        canManageTournaments: false,
        canHandleSupport: false,
      };
  }
};

/* =======================================================
   ➕ CREATE STAFF (ADMIN)
======================================================= */
exports.createStaff = async (req, res) => {
  try {
    const adminId = req.admin._id;
    let { name, email, password, role, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }

    email = email.toLowerCase().trim();

    // ❗ Check duplicate under SAME admin only
    const existing = await Staff.findOne({ email, adminId });
    if (existing) {
      return res.status(400).json({ message: "Staff with this email already exists under you" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If permissions not provided, auto assign based on role
    if (!permissions) {
      permissions = getDefaultPermissions(role);
    }

    const staff = await Staff.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      role,
      permissions,
      adminId,
    });

    const safeStaff = staff.toObject();
    delete safeStaff.password;

    res.status(201).json({ success: true, staff: safeStaff });
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
    const { name, role, permissions, isActive, password } = req.body;

    const staff = await Staff.findOne({ _id: staffId, adminId });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (name !== undefined) staff.name = name.trim();
    if (role !== undefined) {
      staff.role = role;

      // If role changed and permissions not explicitly sent → reset defaults
      if (!permissions) {
        staff.permissions = getDefaultPermissions(role);
      }
    }

    if (permissions !== undefined) {
      staff.permissions = {
        canManageResults: !!permissions.canManageResults,
        canManageTournaments: !!permissions.canManageTournaments,
        canHandleSupport: !!permissions.canHandleSupport,
      };
    }

    if (isActive !== undefined) staff.isActive = !!isActive;

    // Optional password reset by admin
    if (password) {
      staff.password = await bcrypt.hash(password, 10);
    }

    await staff.save();

    const safeStaff = staff.toObject();
    delete safeStaff.password;

    res.json({ success: true, staff: safeStaff });
  } catch (err) {
    console.error("Update staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   🚫 DEACTIVATE STAFF
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

/* =======================================================
   ✅ ACTIVATE STAFF AGAIN
======================================================= */
exports.activateStaff = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { staffId } = req.params;

    const staff = await Staff.findOne({ _id: staffId, adminId });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    staff.isActive = true;
    await staff.save();

    res.json({ success: true, message: "Staff activated" });
  } catch (err) {
    console.error("Activate staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
