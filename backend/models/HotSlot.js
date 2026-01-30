const mongoose = require("mongoose");

const hotSlotSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    prizePool: {
      type: String,
      required: true,
    },
    stage: {
      type: String,
      required: true,
    },
    slots: {
      type: Number,
      required: true,
      min: 1,
    },
    contact: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HotSlot", hotSlotSchema);
