const express = require("express");
const router = express.Router();

const {
createStaff,
getAllStaff,
updateStaff,
deactivateStaff,
activateStaff,
} = require("../controllers/staffManagementController");

const adminAuth = require("../middleware/adminAuth");

/* =======================================================
🎯 PHASE 10 — STAFF MANAGEMENT (ADMIN PANEL)
Base Path: /api/v1/admin/staff
🔐 Admin-only access
======================================================= */

/* ➕ Create New Staff */
router.post("/", adminAuth, createStaff);

/* 📋 Get All Staff Under This Admin */
router.get("/", adminAuth, getAllStaff);

/* ✏️ Update Staff Info / Role / Permissions / Status */
router.patch("/:staffId", adminAuth, updateStaff);

/* 🚫 Deactivate Staff Account */
router.patch("/deactivate/:staffId", adminAuth, deactivateStaff);

/* ✅ Reactivate Staff Account */
router.patch("/activate/:staffId", adminAuth, activateStaff);

module.exports = router;
