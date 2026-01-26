const mongoose = require("mongoose");

const hotSlotSchema = new mongoose.Schema({
  tournament: String,
  prizePool: String,
  stage: String,
  slots: String,
  contact: String
}, { timestamps: true });

module.exports = mongoose.model("HotSlot", hotSlotSchema);
