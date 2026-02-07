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
  trim: true,
},

screenshotUrl: {
  type: String,
  required: true,
  trim: true,
},

// Entry fee amount at time of payment
amount: {
  type: Number,
  required: true,
  min: 1,
},

// Optional transaction reference (UPI ID / Ref No.)
transactionNote: {
  type: String,
  default: null,
  trim: true,
},

status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending",
},

// Admin verification tracking
verifiedAt: {
  type: Date,
  default: null,
},

verifiedBy: {
  type: String,
  default: null,
},

},
{ timestamps: true }
);

// Prevent duplicate payment proof for same user in same tournament
paymentProofSchema.index({ tournamentId: 1, userEmail: 1 }, { unique: true });

module.exports = mongoose.model("PaymentProof", paymentProofSchema);
