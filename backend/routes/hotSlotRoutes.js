const express = require("express");
const router = express.Router();
const HotSlot = require("../models/HotSlot");

/* =========================
   PUBLIC HOT SLOTS
   Pagination + Expiry Safe
========================= */
router.get("/", async (req, res) => {
  try {
    // -------- Pagination params --------
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 30); // max 30
    const skip = (page - 1) * limit;

    // -------- Expiry filter --------
    const now = new Date();

    const filter = {
      expiresAt: { $gt: now }, // 🔥 expired slots hidden
    };

    // -------- Query --------
    const [slots, total] = await Promise.all([
      HotSlot.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      HotSlot.countDocuments(filter),
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      slots,
    });
  } catch (err) {
    console.error("HotSlot fetch error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
});

module.exports = router;
