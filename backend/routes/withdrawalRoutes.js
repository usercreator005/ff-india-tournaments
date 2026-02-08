const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");

const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const WithdrawalRequest = require("../models/WithdrawalRequest");

/* =========================
   HELPERS
========================= */
const adminOnly = (req, res, next) => {
  if (req.role !== "admin" && !req.isSuperAdmin) {
    return res.status(403).json({ success: false, msg: "Admin only" });
  }
  next();
};

const creatorOnly = (req, res, next) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ success: false, msg: "Creator only" });
  }
  next();
};

/* =========================
   ADMIN → REQUEST WITHDRAWAL
========================= */
router.post("/request", apiLimiter, auth, adminOnly, async (req, res) => {
  try {
    const { amount, upiId } = req.body;
    const adminId = req.adminId;

    if (!amount || amount <= 0 || !upiId) {
      return res.status(400).json({
        success: false,
        msg: "Amount and UPI ID required"
      });
    }

    const wallet = await Wallet.findOne({ adminId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        msg: "Insufficient wallet balance"
      });
    }

    const request = await WithdrawalRequest.create({
      adminId,
      amount,
      upiId
    });

    res.status(201).json({
      success: true,
      msg: "Withdrawal request submitted",
      request
    });
  } catch (err) {
    console.error("Withdrawal request error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

/* =========================
   CREATOR → VIEW ALL REQUESTS
========================= */
router.get("/all", apiLimiter, auth, creatorOnly, async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find()
      .populate("adminId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    console.error("Fetch withdrawal requests error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

/* =========================
   CREATOR → APPROVE / REJECT
========================= */
router.patch("/:id", apiLimiter, auth, creatorOnly, async (req, res) => {
  try {
    const { status } = req.body; // approved | rejected

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, msg: "Invalid status" });
    }

    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ success: false, msg: "Request not found or already processed" });
    }

    request.status = status;
    request.processedBy = req.adminId || null;
    request.processedAt = new Date();
    await request.save();

    // 💸 If approved → deduct from wallet + log transaction
    if (status === "approved") {
      const wallet = await Wallet.findOne({ adminId: request.adminId });

      if (wallet) {
        wallet.balance -= request.amount;
        await wallet.save();

        await WalletTransaction.create({
          adminId: request.adminId,
          type: "debit",
          amount: request.amount,
          description: "Withdrawal approved"
        });
      }
    }

    res.json({ success: true, msg: `Withdrawal ${status}` });
  } catch (err) {
    console.error("Process withdrawal error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

module.exports = router;
