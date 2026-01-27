const express = require("express");
const router = express.Router();
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");

/* =========================
   CREATE TOURNAMENT (ADMIN)
========================= */
router.post("/create", auth, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ msg: "Only admin" });
    }

    if (req.body.entryType === "paid" && !req.body.upiId) {
      return res.status(400).json({ msg: "UPI required for paid tournament" });
    }

    const tournament = await Tournament.create({
      name: req.body.name,
      slots: req.body.slots,
      prizePool: req.body.prizePool,
      entryType: req.body.entryType,
      entryFee: req.body.entryFee || 0,

      payment:
        req.body.entryType === "paid"
          ? {
              upiId: req.body.upiId,
              qrImage: req.body.qrImage
            }
          : undefined,

      status: "upcoming",
      createdBy: req.user.email
    });

    res.json({ msg: "Tournament created", tournament });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   UPDATE TOURNAMENT STATUS (ADMIN)
========================= */
router.patch("/status/:id", auth, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can update status" });
    }

    const { status } = req.body;

    if (!["upcoming", "ongoing", "past"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status value" });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ msg: "Tournament not found" });
    }

    tournament.status = status;
    await tournament.save();

    res.json({
      msg: "Tournament status updated",
      tournament
    });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   FETCH TOURNAMENTS (PUBLIC – USER)
========================= */
router.get("/public/:status", async (req, res) => {
  try {
    const tournaments = await Tournament.find({
      status: req.params.status
    }).sort({ createdAt: -1 });

    res.json(tournaments);
  } catch (err) {
    console.error("Public fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   FETCH TOURNAMENTS (ADMIN PANEL)
========================= */
router.get("/admin/:status", auth, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ msg: "Only admin access" });
    }

    const tournaments = await Tournament.find({
      status: req.params.status
    }).sort({ createdAt: -1 });

    res.json(tournaments);
  } catch (err) {
    console.error("Admin fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
