const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        "ENTRY_FEE_CREDIT",
        "MANUAL_ADJUSTMENT",
        "WITHDRAW_REQUEST",
        "WITHDRAW_APPROVED",
        "WITHDRAW_REJECTED"
      ],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: "completed"
    },

    note: {
      type: String,
      trim: true
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
      // Can store tournamentId, withdraw request id, etc.
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
