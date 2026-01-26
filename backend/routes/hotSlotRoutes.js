const express = require("express");
const router = express.Router();
const HotSlot = require("../models/HotSlot");

// Public hot slots for users
router.get("/", async (req, res) => {
  const slots = await HotSlot.find().sort({ createdAt: -1 });
  res.json(slots);
});

module.exports = router;
