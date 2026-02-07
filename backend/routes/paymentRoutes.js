const express = require("express");
const router = express.Router();
const PaymentProof = require("../models/PaymentProof");
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");
const { body, param, validationResult } = require("express-validator");

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
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

      const tournament = await Tournament.findById(tournamentId);
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
        userEmail: req.user.email,
        screenshotUrl,
        transactionNote: transactionNote || null,
        amount: tournament.entryFee, // Locked from DB
      });

      res.json({ success: true, msg: "Proof submitted for admin review", proof });
    } catch (err) {
      console.error("Payment upload error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   ADMIN VIEW PROOFS
========================= */
router.get(
  "/admin/:tournamentId",
  auth,
  param("tournamentId").isMongoId(),
  async (req, res) => {
    try {
      if (req.role !== "admin") {
        return res.status(403).json({ success: false, msg: "Admin only" });
      }

      if (validate(req, res)) return;

      const proofs = await PaymentProof.find({
        tournamentId: req.params.tournamentId,
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
  param("id").isMongoId(),
  body("status").isIn(["approved", "rejected"]),
  async (req, res) => {
    try {
      if (req.role !== "admin") {
        return res.status(403).json({ success: false, msg: "Admin only" });
      }

      if (validate(req, res)) return;

      const proof = await PaymentProof.findById(req.params.id);
      if (!proof) {
        return res.status(404).json({ success: false, msg: "Payment proof not found" });
      }

      proof.status = req.body.status;
      proof.verifiedAt = new Date();
      proof.verifiedBy = req.user.email;

      await proof.save();

      res.json({ success: true, msg: `Payment ${req.body.status}`, proof });
    } catch (err) {
      console.error("Admin payment update error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
