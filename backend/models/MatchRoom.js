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
       ROUND SUPPORT
    ========================= */
    round: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* =========================
       VISIBILITY CONTROL
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
       ACTIVE FLAG
       Admin can disable a room without deleting
    ========================= */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* =========================
       🔐 ADMIN DATA BOUNDARY
       Must ALWAYS match tournament.adminId
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

// One room per round per tournament (core rule)
matchRoomSchema.index(
  { tournamentId: 1, round: 1 },
  { unique: true }
);

// Fast lookup for visible player room
matchRoomSchema.index({ tournamentId: 1, isPublished: 1, isActive: 1 });

// Admin dashboard filtering
matchRoomSchema.index({ adminId: 1, tournamentId: 1 });

/* =========================
   MIDDLEWARE
========================= */

// Auto-set publishedAt when room is published
matchRoomSchema.pre("save", function (next) {
  if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

/* =========================
   TRANSFORM OUTPUT
   Never leak password accidentally
========================= */
matchRoomSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.roomPassword;
    return ret;
  },
});

module.exports = mongoose.model("MatchRoom", matchRoomSchema);
