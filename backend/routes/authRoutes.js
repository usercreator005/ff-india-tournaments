const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/role", authMiddleware, (req, res) => {
  res.json({
    email: req.user.email,
    role: req.role
  });
});

module.exports = router;
