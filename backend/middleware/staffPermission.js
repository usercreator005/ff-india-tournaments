/* =======================================================
   🛡 STAFF PERMISSION MIDDLEWARE
   Usage: staffPermission("canManageResults")
======================================================= */

module.exports = (permissionKey) => {
  return (req, res, next) => {
    if (!req.staff) {
      return res.status(401).json({ message: "Unauthorized - Staff only" });
    }

    if (!req.staff.permissions || !req.staff.permissions[permissionKey]) {
      return res.status(403).json({ message: "Permission denied" });
    }

    next();
  };
};
