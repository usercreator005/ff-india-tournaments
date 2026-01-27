const express = require("express");
const router = express.Router();
const PaymentProof = require("../models/PaymentProof");
const auth = require("../middleware/authMiddleware");

/* =========================
   USER UPLOAD PAYMENT PROOF
========================= */
router.post("/upload", auth, async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({ msg: "Only users allowed" });
    }

    const proof = await PaymentProof.create({
      tournamentId: req.body.tournamentId,
      userEmail: req.user.email,
      screenshotUrl: req.body.screenshotUrl
    });

    res.json({ msg: "Payment proof submitted", proof });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* =========================
   ADMIN VIEW PAYMENT PROOFS
========================= */
router.get("/admin/:tournamentId", auth, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ msg: "Admin only" });
  }

  const proofs = await PaymentProof.find({
    tournamentId: req.params.tournamentId
  });

  res.json(proofs);
});

/* =========================
   ADMIN APPROVE / REJECT
========================= */
router.patch("/status/:id", auth, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ msg: "Admin only" });
  }

  const proof = await PaymentProof.findById(req.params.id);
  if (!proof) return res.status(404).json({ msg: "Not found" });

  proof.status = req.body.status;
  await proof.save();

  res.json({ msg: "Status updated", proof });
});

module.exports = router;
