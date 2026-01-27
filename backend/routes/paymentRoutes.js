const mongoose = require("mongoose");

const paymentProofSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true
    },

    userEmail: {
      type: String,
      required: true
    },

    screenshotUrl: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentProof", paymentProofSchema);
