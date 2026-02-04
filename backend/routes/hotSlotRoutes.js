const express = require("express");
const router = express.Router();
const HotSlot = require("../models/HotSlot");

/* =========================
   PUBLIC HOT SLOTS (ACTIVE ONLY)
   - No auth required
   - Expired slots hidden
========================= */
router.get("/", async (req, res) => {
  try {
    const now = new Date();

    const slots = await HotSlot.find({
      expiresAt: { $gt: now }, // 🔥 only active slots
    })
      .sort({ createdAt: -1 }) // latest first
      .lean();

    res.json({
      success: true,
      count: slots.length,
      slots,
    });
  } catch (err) {
    console.error("HotSlot Fetch Error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch hot slots",
    });
  }
});

module.exports = router;
