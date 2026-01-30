const express = require("express");
const router = express.Router();
const HotSlot = require("../models/HotSlot");

/* =========================
   PUBLIC HOT SLOTS
========================= */
router.get("/", async (req, res) => {
  try {
    const slots = await HotSlot.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

module.exports = router;
