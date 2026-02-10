const express = require("express");
const router = express.Router();

const { getAdminDashboard } = require("../controllers/adminDashboardController");
const adminAuth = require("../middleware/adminAuth");

/* =======================================================
   📊 PHASE 12 — ADMIN PROFILE DASHBOARD ROUTES
   Base Path: /api/v1/admin/dashboard
   🔐 Admin only access
======================================================= */

/* 👤 Get Admin Dashboard Overview */
router.get("/", adminAuth, getAdminDashboard);

module.exports = router;
