const express = require("express");
const router = express.Router();

const {
  createStaff,
  getAllStaff,
  updateStaff,
  deactivateStaff,
} = require("../controllers/staffManagementController");

const adminAuth = require("../middleware/adminAuth");

/* =======================================================
   🎯 PHASE 10 — STAFF MANAGEMENT (ADMIN)
   Base Path: /api/v1/admin/staff
======================================================= */

router.post("/", adminAuth, createStaff);          // Create staff
router.get("/", adminAuth, getAllStaff);           // List all staff
router.patch("/:staffId", adminAuth, updateStaff); // Update role/permissions/status
router.delete("/:staffId", adminAuth, deactivateStaff); // Deactivate

module.exports = router;
