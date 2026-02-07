const mongoose = require("mongoose");

const paymentProofSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    screenshotUrl: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verifiedAt: Date,
    verifiedBy: String,
  },
  { timestamps: true }
);

paymentProofSchema.index({ tournamentId: 1, userEmail: 1 }, { unique: true });

module.exports = mongoose.model("PaymentProof", paymentProofSchema);
