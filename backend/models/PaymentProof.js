const mongoose = require("mongoose");

const paymentProofSchema = new mongoose.Schema(
  {
    /* =========================
       LINK TO TOURNAMENT
    ========================= */
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },

    /* =================================================
       🔐 PHASE 1 DATA BOUNDARY — ADMIN OWNERSHIP
       Every payment proof belongs to the SAME admin
       who owns the tournament
    ================================================= */
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
      index: true,
    },

    /* =========================
       USER INFO
    ========================= */
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /* =========================
       PAYMENT DETAILS
    ========================= */
    screenshotUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // Entry fee amount at time of payment (snapshot for record safety)
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    // Optional transaction reference (UPI Ref No. / Note)
    transactionNote: {
      type: String,
      default: null,
      trim: true,
    },

    /* =========================
       VERIFICATION STATUS
    ========================= */
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

/* =========================
   INDEXES
========================= */

// Prevent duplicate payment proof per user per tournament
paymentProofSchema.index(
  { tournamentId: 1, userEmail: 1 },
  { unique: true }
);

// Fast admin dashboard filtering
paymentProofSchema.index({ adminId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("PaymentProof", paymentProofSchema);
