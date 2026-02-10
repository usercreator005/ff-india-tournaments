const express = require("express");
const router = express.Router();

const {
  createTicket,
  getMyTickets,
  getAllTickets,
  replyToTicket,
  updateTicketStatus,
} = require("../controllers/supportTicketController");

const auth = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminAuth");
const { verifyStaff } = require("../middleware/staffAuth");

/* =======================================================
   🎫 PHASE 11 — SUPPORT TICKET SYSTEM
   Base Path: /api/v1/support
======================================================= */

/* =======================================================
   👤 USER ROUTES
======================================================= */

// Create support ticket
router.post("/create", auth, createTicket);

// Get logged-in user's tickets
router.get("/my", auth, getMyTickets);

// Reply to own ticket
router.post("/reply/:ticketId", auth, replyToTicket);


/* =======================================================
   🧑‍💼 ADMIN / SUPPORT STAFF ROUTES
======================================================= */

// Middleware: Admin OR Staff with support permission
const adminOrSupportStaff = (req, res, next) => {
  adminAuth(req, res, (adminErr) => {
    if (!adminErr && req.admin) return next();

    verifyStaff(req, res, () => {
      if (req.staff?.permissions?.canHandleSupport) return next();
      return res.status(403).json({ success: false, message: "Access denied" });
    });
  });
};

// Get all tickets under admin
router.get("/admin/all", adminOrSupportStaff, getAllTickets);

// Reply to any ticket
router.post("/admin/reply/:ticketId", adminOrSupportStaff, replyToTicket);

// Update ticket status
router.patch("/admin/status/:ticketId", adminOrSupportStaff, updateTicketStatus);

module.exports = router;
