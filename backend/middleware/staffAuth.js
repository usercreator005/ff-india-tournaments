const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");

/* =======================================================
   🔐 VERIFY STAFF TOKEN
======================================================= */
exports.verifyStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "staff") {
      return res.status(403).json({ message: "Access denied - Not staff" });
    }

    const staff = await Staff.findById(decoded.id);

    if (!staff || !staff.isActive) {
      return res.status(401).json({ message: "Staff not found or inactive" });
    }

    // Attach staff info to request
    req.staff = {
      _id: staff._id,
      adminId: staff.adminId,
      role: staff.role,
      permissions: staff.permissions || [],
    };

    next();
  } catch (err) {
    console.error("Staff auth error:", err.message);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

/* =======================================================
   🧩 PERMISSION CHECK MIDDLEWARE
   Usage: checkPermission("manage_results")
======================================================= */
exports.checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.staff) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.staff.permissions.includes(requiredPermission)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    next();
  };
};
