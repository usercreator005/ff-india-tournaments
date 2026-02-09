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
      index: true,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },

    /* =========================
       SLOT ASSIGNMENT
    ========================= */

    slotNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    /* =========================
       ROOM LINK (FILLED LATER)
       Phase 5 = optional
       Phase 6+ = auto mapping
    ========================= */
    matchRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MatchRoom",
      default: null,
      index: true,
    },

    /* =========================
       TEAM SNAPSHOT (IMMUTABLE)
       Prevents future rename issues
    ========================= */
    teamName: {
      type: String,
      trim: true,
    },

    captainEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    /* =========================
       STATUS FLOW
    ========================= */
    status: {
      type: String,
      enum: ["assigned", "checked-in", "eliminated", "qualified"],
      default: "assigned",
      index: true,
    },

    /* =================================================
       🔐 PHASE 1 CORE SECURITY — ADMIN DATA BOUNDARY
    ================================================= */
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* =========================
   INDEXES (CRITICAL)
========================= */

// One slot per tournament
lobbySchema.index({ tournamentId: 1, slotNumber: 1 }, { unique: true });

// One team per tournament
lobbySchema.index({ tournamentId: 1, teamId: 1 }, { unique: true });

// Admin dashboard fast filtering
lobbySchema.index({ adminId: 1, tournamentId: 1, status: 1 });

// Room → lobby fast lookup (future automation)
lobbySchema.index({ matchRoomId: 1, status: 1 });

/* =========================
   AUTO TEAM SNAPSHOT
   Saves team name + captain at join time
========================= */
lobbySchema.pre("save", async function (next) {
  if (!this.teamName || !this.captainEmail) {
    try {
      const Team = mongoose.model("Team");
      const team = await Team.findById(this.teamId).select("name captain");
      if (team) {
        this.teamName = team.name;
        this.captainEmail = team.captain;
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Lobby", lobbySchema);
