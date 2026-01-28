const mongoose = require("mongoose");

const paymentProofSchema = new mongoose.Schema(
  {
    userEmail: String,
    tournamentId: mongoose.Schema.Types.ObjectId,

    screenshot: String,

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    reviewedBy: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentProof", paymentProofSchema);
