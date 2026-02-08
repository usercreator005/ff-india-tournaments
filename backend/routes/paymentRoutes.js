const express = require("express");
const router = express.Router();
const PaymentProof = require("../models/PaymentProof");
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");
const { body, param, validationResult } = require("express-validator");

/* =========================
   HELPERS
========================= */
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

const adminOnly = (req, res, next) => {
  if (req.role !== "admin" && !req.isSuperAdmin) {
    return res.status(403).json({ success: false, msg: "Admin only" });
  }
  next();
};

/* =========================
   USER SUBMITS PAYMENT PROOF
========================= */
router.post(
  "/upload",
  auth,
  body("tournamentId").isMongoId(),
  body("screenshotUrl").isString().notEmpty(),
  body("transactionNote").optional().isString().trim(),
  async (req, res) => {
    try {
      if (req.role !== "user") {
        return res.status(403).json({ success: false, msg: "User only" });
      }

      if (validate(req, res)) return;

      const { tournamentId, screenshotUrl, transactionNote } = req.body;

      const tournament = await Tournament.findById(tournamentId).select(
        "_id entryType entryFee status adminId"
      );

      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      if (tournament.entryType !== "paid") {
        return res.status(400).json({ success: false, msg: "This tournament is free" });
      }

      if (tournament.status !== "upcoming") {
        return res.status(400).json({ success: false, msg: "Tournament is closed" });
      }

      const existingProof = await PaymentProof.findOne({
        tournamentId,
        userEmail: req.user.email,
      });

      if (existingProof) {
        if (existingProof.status === "approved") {
          return res.status(400).json({
            success: false,
            msg: "Payment already verified",
          });
        }
        return res.status(400).json({
          success: false,
          msg: "Payment proof already submitted and under review",
        });
      }

      const proof = await PaymentProof.create({
        tournamentId,
        adminId: tournament.adminId, // 🔐 PHASE 1 DATA ISOLATION
        userEmail: req.user.email,
        screenshotUrl,
        transactionNote: transactionNote || null,
        amount: tournament.entryFee, // Snapshot for audit safety
      });

      res.json({ success: true, msg: "Proof submitted for admin review", proof });
    } catch (err) {
      console.error("Payment upload error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   ADMIN VIEW PROOFS (Scoped)
========================= */
router.get(
  "/admin/:tournamentId",
  auth,
  adminOnly,
  param("tournamentId").isMongoId(),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const tournament = await Tournament.findById(req.params.tournamentId).select("adminId");
      if (!tournament) {
        return res.status(404).json({ success: false, msg: "Tournament not found" });
      }

      // 🔐 Admin can only see proofs for their own tournament
      if (!req.isSuperAdmin && tournament.adminId.toString() !== req.adminId) {
        return res.status(403).json({ success: false, msg: "Access denied" });
      }

      const proofs = await PaymentProof.find({
        tournamentId: req.params.tournamentId,
        adminId: tournament.adminId,
      }).sort({ createdAt: -1 });

      res.json({ success: true, proofs });
    } catch (err) {
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   ADMIN APPROVE / REJECT
========================= */
router.patch(
  "/status/:id",
  auth,
  adminOnly,
  param("id").isMongoId(),
  body("status").isIn(["approved", "rejected"]),
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const proof = await PaymentProof.findById(req.params.id);
      if (!proof) {
        return res.status(404).json({ success: false, msg: "Payment proof not found" });
      }

      // 🔐 Ensure admin owns this proof
      if (!req.isSuperAdmin && proof.adminId.toString() !== req.adminId) {
        return res.status(403).json({ success: false, msg: "Access denied" });
      }

      if (proof.status !== "pending") {
        return res.status(400).json({
          success: false,
          msg: "Payment proof already processed",
        });
      }

      proof.status = req.body.status;
      proof.verifiedAt = new Date();
      proof.verifiedBy = req.adminId;

      await proof.save();

      res.json({ success: true, msg: `Payment ${req.body.status}`, proof });
    } catch (err) {
      console.error("Admin payment update error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
