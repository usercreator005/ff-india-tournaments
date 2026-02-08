const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

/* =========================
   ADMIN ONLY
========================= */
const adminOnly = (req, res, next) => {
  if (req.role !== "admin" && !req.isSuperAdmin) {
    return res.status(403).json({ success: false, msg: "Admin only" });
  }
  next();
};

/* =========================
   GET WALLET BALANCE
========================= */
router.get("/balance", apiLimiter, auth, adminOnly, async (req, res) => {
  try {
    const adminId = req.adminId;

    const wallet = await Wallet.findOne({ adminId });

    if (!wallet) {
      return res.json({
        success: true,
        balance: 0
      });
    }

    res.json({
      success: true,
      balance: wallet.balance
    });
  } catch (err) {
    console.error("Fetch wallet balance error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

/* =========================
   GET WALLET TRANSACTIONS
========================= */
router.get("/transactions", apiLimiter, auth, adminOnly, async (req, res) => {
  try {
    const adminId = req.adminId;

    const transactions = await WalletTransaction.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(50); // latest 50 for dashboard

    res.json({
      success: true,
      transactions
    });
  } catch (err) {
    console.error("Fetch wallet transactions error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

module.exports = router;
