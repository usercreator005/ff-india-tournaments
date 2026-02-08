const mongoose = require("mongoose");

const lobbySchema = new mongoose.Schema(
  {
    /* =========================
       RELATIONS
    ========================= */

    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true
    },

    /* =========================
       SLOT ASSIGNMENT
    ========================= */

    slotNumber: {
      type: Number,
      required: true,
      min: 1
    },

    /* =========================
       ROOM INFO (OPTIONAL LINK)
       Maps lobby slot → match room later
    ========================= */
    matchRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MatchRoom",
      default: null,
      index: true
    },

    /* =========================
       STATUS FLOW (PHASE READY)
    ========================= */
    status: {
      type: String,
      enum: ["assigned", "checked-in", "eliminated", "qualified"],
      default: "assigned",
      index: true
    },

    /* =================================================
       🔐 PHASE 1 CORE SECURITY — ADMIN DATA BOUNDARY
    ================================================= */
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
      index: true
    }
  },
  { timestamps: true }
);

/* =========================
   INDEXES (CRITICAL)
========================= */

// One slot per tournament can only be used once
lobbySchema.index({ tournamentId: 1, slotNumber: 1 }, { unique: true });

// A team can only join a tournament once
lobbySchema.index({ tournamentId: 1, teamId: 1 }, { unique: true });

// Fast admin dashboard queries
lobbySchema.index({ adminId: 1, tournamentId: 1 });

// Fast room-based lookups (Phase 6+)
lobbySchema.index({ matchRoomId: 1, status: 1 });

module.exports = mongoose.model("Lobby", lobbySchema);
