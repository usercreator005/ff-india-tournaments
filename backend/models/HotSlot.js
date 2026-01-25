const mongoose = require("mongoose");

const hotSlotSchema = new mongoose.Schema({
  tournamentName: String,
  prizePool: String,
  stage: String,
  slotList: String,
  contact: String
});

module.exports = mongoose.model("HotSlot", hotSlotSchema);
