const mongoose = require("mongoose");

const hotSlotSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },

    prizePool: {
      type: Number,
      required: true,
      min: 0,
    },

    stage: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    slots: {
      type: Number,
      required: true,
      min: 1,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =========================
   INDEXES
========================= */
hotSlotSchema.index({ tournament: 1, createdAt: -1 });

module.exports = mongoose.model("HotSlot", hotSlotSchema);
