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
    const existingEntry = await Lobby.findOne({ tournamentId, teamId }).session(session);
    if (existingEntry) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        msg: "Team already joined this tournament",
      });
    }

    /* =========================
       ATOMIC SLOT RESERVATION
       Prevents race condition when many teams join at same time
    ========================= */
    const updatedTournament = await Tournament.findOneAndUpdate(
      {
        _id: tournamentId,
        status: "upcoming",
        filledSlots: { $lt: tournament.slots },
      },
      {
        $inc: { filledSlots: 1 },
        $addToSet: { teams: teamId }, // supportive cache sync
      },
      { new: true, session }
    );

    if (!updatedTournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, msg: "Tournament full or unavailable" });
    }

    const slotNumber = updatedTournament.filledSlots;

    /* =========================
       CREATE LOBBY ENTRY
    ========================= */
    const lobbyEntry = await Lobby.create(
      [
        {
          tournamentId,
          teamId,
          slotNumber,
          adminId: updatedTournament.adminId, // 🔐 Admin boundary
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      msg: "Team joined successfully",
      slotNumber,
      lobbyEntry: lobbyEntry[0],
      slotsLeft: updatedTournament.slots - updatedTournament.filledSlots,
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
