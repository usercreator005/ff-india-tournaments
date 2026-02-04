const express = require("express");
const router = express.Router();
const HotSlot = require("../models/HotSlot");

/* =========================
   PUBLIC HOT SLOTS
   Pagination + Expiry Safe
   C5 IMPLEMENTATION
========================= */
router.get("/", async (req, res) => {
  try {
    /* =========================
       PAGINATION (SAFE)
    ========================= */
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 30) limit = 30; // hard cap

    const skip = (page - 1) * limit;

    /* =========================
       EXPIRY FILTER
    ========================= */
    const now = new Date();

    const filter = {
      expiresAt: { $gt: now }, // 🔥 only active hot slots
    };

    /* =========================
       QUERY
    ========================= */
    const [slots, total] = await Promise.all([
      HotSlot.find(filter)
        .select(
          "title description prizePool stage slots contact createdBy createdAt expiresAt"
        )
        .sort({ createdAt: -1, _id: -1 }) // stable sort
        .skip(skip)
        .limit(limit)
        .lean(),

      HotSlot.countDocuments(filter),
    ]);

    /* =========================
       RESPONSE
    ========================= */
    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
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
