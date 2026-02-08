const mongoose = require("mongoose");

const matchRoomSchema = new mongoose.Schema(
  {
    /* =========================
       TOURNAMENT LINK
    ========================= */
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },

    /* =========================
       ROOM DETAILS
    ========================= */
    roomId: {
      type: String,
      required: true,
      trim: true,
    },

    roomPassword: {
      type: String,
      required: true,
      trim: true,
      select: false, // 🔒 Hidden unless explicitly requested
    },

    /* =========================
       ROUND SUPPORT (FUTURE SAFE)
       Phase 3 = Single round
       Future = Multi-stage tournaments
    ========================= */
    round: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* =========================
       VISIBILITY CONTROL
       Admin can create early but publish later
    ========================= */
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    /* =========================
       AUTO VISIBILITY FLAG
       Helps frontend know if room can be shown
    ========================= */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* =========================
       🔐 ADMIN DATA BOUNDARY
    ========================= */
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   INDEXES
========================= */

// Fast lookup of rooms per tournament
matchRoomSchema.index({ tournamentId: 1, round: 1 });

// One room per round per tournament
matchRoomSchema.index(
  { tournamentId: 1, round: 1 },
  { unique: true }
);

// Fast admin dashboard filtering
matchRoomSchema.index({ adminId: 1, isPublished: 1 });

/* =========================
   MIDDLEWARE
========================= */

// Auto-set publishedAt when published
matchRoomSchema.pre("save", function (next) {
  if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("MatchRoom", matchRoomSchema);
