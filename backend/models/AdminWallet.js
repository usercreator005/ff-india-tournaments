const mongoose = require("mongoose");

const adminWalletSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      unique: true,
      index: true
    },

    balance: {
      type: Number,
      default: 0,
      min: 0
    },

    totalEarnings: {
      type: Number,
      default: 0,
      min: 0
    },

    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AdminWallet", adminWalletSchema);
