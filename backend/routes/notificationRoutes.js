const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/authMiddleware");

/* USER FETCH */
router.get("/", auth, async (req, res) => {
  const notifications = await Notification.find({
    userEmail: req.user.email,
  }).sort({ createdAt: -1 });

  res.json({ success: true, notifications });
});

/* ADMIN CREATE */
router.post("/admin", auth, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ success: false, msg: "Admin only" });
  }

  const notif = await Notification.create(req.body);
  res.json({ success: true, notif });
});

module.exports = router;
