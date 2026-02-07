const express = require("express");
const router = express.Router();
const PaymentProof = require("../models/PaymentProof");
const Tournament = require("../models/Tournament");
const auth = require("../middleware/authMiddleware");
const { body, param, validationResult } = require("express-validator");

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

/* =========================
   USER SUBMITS PAYMENT PROOF
========================= */
router.post(
  "/upload",
  auth,
  body("tournamentId").isMongoId(),
  body("screenshotUrl").isString().notEmpty(),
  async (req, res) => {
    try {
      if (req.role !== "user") {
        return res.status(403).json({ success: false, msg: "User only" });
      }

      if (validate(req, res)) return;

      const tournament = await Tournament.findById(req.body.tournamentId);
      if (!tournament || tournament.entryType !== "paid") {
        return res.status(400).json({ success: false, msg: "Invalid tournament" });
      }

      const exists = await PaymentProof.findOne({
        tournamentId: req.body.tournamentId,
        userEmail: req.user.email,
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          msg: "Payment already submitted",
        });
      }

      const proof = await PaymentProof.create({
        tournamentId: req.body.tournamentId,
        userEmail: req.user.email,
        screenshotUrl: req.body.screenshotUrl,
        amount: tournament.entryFee,
      });

      res.json({ success: true, msg: "Proof submitted for review", proof });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

/* =========================
   ADMIN VIEW PROOFS
========================= */
router.get("/admin/:tournamentId", auth, async (req, res) => {
  if (req.role !== "admin") {
    return res.status(403).json({ success: false, msg: "Admin only" });
  }

  const proofs = await PaymentProof.find({
    tournamentId: req.params.tournamentId,
  });

  res.json({ success: true, proofs });
});

/* =========================
   ADMIN APPROVE / REJECT
========================= */
router.patch(
  "/status/:id",
  auth,
  body("status").isIn(["approved", "rejected"]),
  async (req, res) => {
    try {
      if (req.role !== "admin") {
        return res.status(403).json({ success: false, msg: "Admin only" });
      }

      if (validate(req, res)) return;

      const proof = await PaymentProof.findById(req.params.id);
      if (!proof) {
        return res.status(404).json({ success: false, msg: "Not found" });
      }

      proof.status = req.body.status;
      proof.verifiedAt = new Date();
      proof.verifiedBy = req.user.email;
      await proof.save();

      res.json({ success: true, msg: "Status updated", proof });
    } catch (err) {
      res.status(500).json({ success: false, msg: "Server error" });
    }
  }
);

module.exports = router;
