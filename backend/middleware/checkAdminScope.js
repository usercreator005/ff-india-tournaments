const mongoose = require("mongoose");

/**
 * Middleware to restrict ADMIN access to their own organization data
 * SUPER_ADMIN bypasses scope restriction
 *
 * Usage:
 * router.get("/:id", checkAdminScope(ModelName), controller)
 */
const checkAdminScope = (Model) => {
  return async (req, res, next) => {
    try {
      const admin = req.admin; // comes from auth middleware

      if (!admin) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // SUPER ADMIN can access everything
      if (admin.role === "SUPER_ADMIN") {
        return next();
      }

      const resourceId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const resource = await Model.findById(resourceId).select("organizationId");

      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      if (resource.organizationId.toString() !== admin.organizationId.toString()) {
        return res.status(403).json({
          message: "Access denied: Not your organization data",
        });
      }

      next();
    } catch (error) {
      console.error("Scope check failed:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
};

module.exports = checkAdminScope;
