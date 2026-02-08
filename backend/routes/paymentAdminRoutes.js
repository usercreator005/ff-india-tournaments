const express = require("express");
const router = express.Router();
const PaymentProof = require("../models/PaymentProof");
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const { creditWallet } = require("../services/walletService");
const { param, body, validationResult } = require("express-validator");

/* =========================
   ADMIN ONLY MIDDLEWARE
========================= */
const adminOnly = (req, res, next) => {
  if (req.role !== "admin" && !req.isSuperAdmin) {
    return res.status(403).json({ success: false, msg: "Admin only" });
  }
  next();
};

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

/* =========================
   GET PENDING PAYMENT PROOFS
========================= */
router.get("/pending", apiLimiter, auth, adminOnly, async (req, res) => {
  try {
    const filter = req.isSuperAdmin
      ? { status: "pending" }
      : { status: "pending", adminId: req.adminId };

    const proofs = await PaymentProof.find(filter)
      .populate("tournamentId", "name entryFee entryType")
      .sort({ createdAt: -1 });

    res.json({ success: true, proofs });
  } catch (err) {
    console.error("Fetch pending proofs error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

/* =========================
   APPROVE PAYMENT PROOF
========================= */
router.patch(
  "/approve/:id",
  apiLimiter,
  auth,
  adminOnly,
  [param("id").isMongoId()],
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const proof = await PaymentProof.findById(req.params.id);
      if (!proof) {
        return res.status(404).json({ success: false, msg: "Payment proof not found" });
      }

      if (proof.status !== "pending") {
        return res.status(400).json({ success: false, msg: "Proof already processed" });
      }

      // Admin isolation check (unless super admin)
      if (!req.isSuperAdmin && proof.adminId.toString() !== req.adminId.toString()) {
        return res.status(403).json({ success: false, msg: "Not your payment proof" });
      }

      const tournament = await Tournament.findById(proof.tournamentId);
      if (!tournament || tournament.entryType !== "paid") {
        return res.status(400).json({ success: false, msg: "Invalid tournament for payment" });
      }

      // ✅ Mark proof approved
      proof.status = "approved";
      proof.reviewedAt = new Date();
      await proof.save();

      // 💰 Credit admin wallet
      const newBalance = await creditWallet({
        adminId: proof.adminId,
        amount: tournament.entryFee,
        type: "TOURNAMENT_ENTRY",
        note: `Entry fee from ${proof.userEmail} for ${tournament.name}`,
        referenceId: tournament._id
      });

      res.json({
        success: true,
        msg: "Payment approved & wallet credited",
        newBalance
      });
    } catch (err) {
      console.error("Approve payment error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   REJECT PAYMENT PROOF
========================= */
router.patch(
  "/reject/:id",
  apiLimiter,
  auth,
  adminOnly,
  [
    param("id").isMongoId(),
    body("reason").optional().isString().trim()
  ],
  async (req, res) => {
    try {
      if (validate(req, res)) return;

      const proof = await PaymentProof.findById(req.params.id);
      if (!proof) {
        return res.status(404).json({ success: false, msg: "Payment proof not found" });
      }

      if (proof.status !== "pending") {
        return res.status(400).json({ success: false, msg: "Proof already processed" });
      }

      if (!req.isSuperAdmin && proof.adminId.toString() !== req.adminId.toString()) {
        return res.status(403).json({ success: false, msg: "Not your payment proof" });
      }

      proof.status = "rejected";
      proof.rejectionReason = req.body.reason || "Rejected by admin";
      proof.reviewedAt = new Date();
      await proof.save();

      res.json({ success: true, msg: "Payment proof rejected" });
    } catch (err) {
      console.error("Reject payment error:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
