const Lobby = require("../models/Lobby");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");

/* =======================================================
   🚀 TEAM JOIN TOURNAMENT → AUTO SLOT ASSIGN
======================================================= */
exports.joinTournamentLobby = async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({ success: false, msg: "Users only" });
    }

    const { tournamentId, teamId } = req.body;

    /* =========================
       VALIDATE TOURNAMENT
    ========================= */
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, msg: "Tournament not found" });
    }

    if (tournament.status !== "upcoming") {
      return res.status(400).json({ success: false, msg: "Tournament closed" });
    }

    if (tournament.filledSlots >= tournament.slots) {
      return res.status(400).json({ success: false, msg: "Tournament full" });
    }

    /* =========================
       VALIDATE TEAM
    ========================= */
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, msg: "Team not found" });
    }

    // User must be part of that team
    if (!team.members.includes(req.user.email)) {
      return res.status(403).json({ success: false, msg: "Not your team" });
    }

    /* =========================
       PREVENT DOUBLE JOIN
    ========================= */
    const existingEntry = await Lobby.findOne({
      tournamentId,
      teamId,
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        msg: "Team already joined this tournament",
      });
    }

    /* =========================
       ASSIGN NEXT SLOT
    ========================= */
    const nextSlotNumber = tournament.filledSlots + 1;

    const lobbyEntry = await Lobby.create({
      tournamentId,
      teamId,
      slotNumber: nextSlotNumber,
      teamName: team.name,
      captainEmail: team.captain,
      adminId: tournament.adminId,
    });

    tournament.filledSlots = nextSlotNumber;
    await tournament.save();

    res.status(201).json({
      success: true,
      msg: "Team joined successfully",
      slotNumber: nextSlotNumber,
      lobbyEntry,
      slotsLeft: tournament.slotsLeft,
    });
  } catch (err) {
    console.error("Lobby join error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
