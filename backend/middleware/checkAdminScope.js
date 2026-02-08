const mongoose = require("mongoose");

/**
 * 🔐 ADMIN DATA SCOPE MIDDLEWARE (PHASE 1)
 *
 * Ensures an Admin can only access resources created by THEM
 * using adminId as the security boundary.
 *
 * SUPER_ADMIN bypasses all restrictions.
 *
 * Supports:
 * - ID based access  → /route/:id
 * - Query scoping    → Model.find() auto-filter by adminId
 *
 * Usage:
 * router.get("/:id", auth, checkAdminScope(Model), controller)
 * router.get("/", auth, checkAdminScope(Model, { query: true }), controller)
 */

const checkAdminScope = (Model, options = {}) => {
  return async (req, res, next) => {
    try {
      const role = req.role;
      const adminId = req.adminId;

      /* =========================
         👑 SUPER ADMIN → FULL ACCESS
      ========================= */
      if (req.isSuperAdmin || role === "SUPER_ADMIN") {
        return next();
      }

      /* =========================
         🚫 ONLY ADMINS ALLOWED
      ========================= */
      if (role !== "ADMIN" || !adminId) {
        return res.status(403).json({
          success: false,
          msg: "Access denied",
        });
      }

      /* =========================
         🔎 QUERY SCOPING MODE
      ========================= */
      if (options.query) {
        // Controllers will use: Model.find(req.adminFilter)
        req.adminFilter = { adminId };
        return next();
      }

      /* =========================
         📌 RESOURCE ID MODE
      ========================= */
      const resourceId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({
          success: false,
          msg: "Invalid resource ID",
        });
      }

      // Only fetch minimal field for security check
      const resource = await Model.findById(resourceId).select("adminId");

      if (!resource) {
        return res.status(404).json({
          success: false,
          msg: "Resource not found",
        });
      }

      if (resource.adminId.toString() !== adminId.toString()) {
        return res.status(403).json({
          success: false,
          msg: "Access denied: Not your data",
        });
      }

      // Optional reuse in controller
      req.resource = resource;

      next();
    } catch (error) {
      console.error("Admin scope check failed:", error);
      res.status(500).json({
        success: false,
        msg: "Server error",
      });
    }
  };
};

module.exports = checkAdminScope;
