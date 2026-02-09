const mongoose = require("mongoose");
const Lobby = require("../models/Lobby");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");

/* =======================================================
   🚀 TEAM JOIN TOURNAMENT → AUTO SLOT ASSIGN (PHASE 5 SAFE)
======================================================= */
exports.joinTournamentLobby = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (req.role !== "user") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, msg: "Users only" });
    }

    const { tournamentId, teamId } = req.body;

    /* =========================
       VALIDATE TOURNAMENT
    ========================= */
    const tournament = await Tournament.findById(tournamentId).session(session);
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, msg: "Tournament not found" });
    }

    if (tournament.status !== "upcoming") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: "Tournament closed" });
    }

    if (tournament.filledSlots >= tournament.slots) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: "Tournament full" });
    }

    /* =========================
       VALIDATE TEAM
    ========================= */
    const team = await Team.findById(teamId).session(session);
    if (!team) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, msg: "Team not found" });
    }

    // User must belong to this team
    if (!team.members.includes(req.user.email)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, msg: "Not your team" });
    }

    /* =========================
       PREVENT DOUBLE JOIN
    ========================= */
    const existingEntry = await Lobby.findOne({
      tournamentId,
      teamId,
    }).session(session);

    if (existingEntry) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        msg: "Team already joined this tournament",
      });
    }

    /* =========================
       SAFE SLOT ASSIGNMENT
       (prevents race conditions)
    ========================= */
    const nextSlotNumber = tournament.filledSlots + 1;

    const lobbyEntry = await Lobby.create(
      [
        {
          tournamentId,
          teamId,
          slotNumber: nextSlotNumber,
          adminId: tournament.adminId, // 🔐 Phase 1 data boundary
        },
      ],
      { session }
    );

    /* =========================
       UPDATE TOURNAMENT COUNT
    ========================= */
    tournament.filledSlots = nextSlotNumber;
    await tournament.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      msg: "Team joined successfully",
      slotNumber: nextSlotNumber,
      lobbyEntry: lobbyEntry[0],
      slotsLeft: tournament.slots - tournament.filledSlots,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Lobby join error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        msg: "Slot already taken or team already joined",
      });
    }

    res.status(500).json({ success: false, msg: "Server error" });
  }
};
