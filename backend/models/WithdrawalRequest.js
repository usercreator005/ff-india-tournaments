const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true,
      min: 1
    },

    upiId: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // creator (super admin)
      default: null
    },

    processedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
