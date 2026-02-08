const mongoose = require("mongoose");

/**
 * 🔐 ADMIN ORGANIZATION SCOPE MIDDLEWARE
 *
 * Ensures an Admin can only access resources belonging to their organization.
 * Creator (Super Admin) bypasses all restrictions.
 *
 * Supports:
 * - ID based access  → /route/:id
 * - Query scoping    → Model.find() auto-filter by organization
 *
 * Usage:
 * router.get("/:id", auth, checkAdminScope(Model), controller)
 * router.get("/", auth, checkAdminScope(Model, { query: true }), controller)
 */

const checkAdminScope = (Model, options = {}) => {
  return async (req, res, next) => {
    try {
      /* =========================
         ROLE & ORG CONTEXT
      ========================= */
      const role = req.role;
      const orgId = req.organizationId;

      // 👑 CREATOR → Full access
      if (role === "creator" || req.isSuperAdmin) {
        return next();
      }

      // 🚫 Only admins should reach here
      if (role !== "admin" || !orgId) {
        return res.status(403).json({
          success: false,
          msg: "Access denied",
        });
      }

      /* =========================
         QUERY SCOPING MODE
      ========================= */
      if (options.query) {
        // Attach org filter to request for controller usage
        req.orgFilter = { organizationId: orgId };
        return next();
      }

      /* =========================
         RESOURCE ID MODE
      ========================= */
      const resourceId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({
          success: false,
          msg: "Invalid resource ID",
        });
      }

      const resource = await Model.findById(resourceId).select("organizationId");

      if (!resource) {
        return res.status(404).json({
          success: false,
          msg: "Resource not found",
        });
      }

      if (resource.organizationId.toString() !== orgId.toString()) {
        return res.status(403).json({
          success: false,
          msg: "Access denied: Not your organization data",
        });
      }

      // Attach resource for downstream reuse (optional optimization)
      req.resource = resource;

      next();
    } catch (error) {
      console.error("Organization scope check failed:", error);
      res.status(500).json({
        success: false,
        msg: "Server error",
      });
    }
  };
};

module.exports = checkAdminScope;
