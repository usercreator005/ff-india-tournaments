const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema({
  name: String,
  slots: Number,
  prizePool: String,
  entryType: String,
  entryFee: Number,
  status: String,
  createdBy: String
}, { timestamps: true });

module.exports = mongoose.model("Tournament", tournamentSchema);
