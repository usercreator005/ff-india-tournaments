const Reminder = require("../models/Reminder");
const Tournament = require("../models/Tournament");
const Lobby = require("../models/Lobby");
const Team = require("../models/Team");

/* =======================================================
   🔔 MANUAL REMINDER SERVICE (PHASE 7 UPDATED)
   Triggered by Admin/Staff button click
   No automatic time-based scheduler anymore
======================================================= */

/* =======================================================
   SEND MANUAL REMINDER TO ALL PARTICIPATING TEAMS
   type = "match_starting" | "room_live"
======================================================= */
const sendManualReminder = async ({ tournamentId, adminId, type }) => {
  try {
    if (!["match_starting", "room_live"].includes(type)) {
      throw new Error("Invalid reminder type");
    }

    /* =========================
       VERIFY TOURNAMENT OWNERSHIP
    ========================= */
    const tournament = await Tournament.findOne({
      _id: tournamentId,
      adminId,
    }).lean();

    if (!tournament) {
      throw new Error("Tournament not found or access denied");
    }

    /* =========================
       FETCH PARTICIPATING TEAMS
    ========================= */
    const lobbyEntries = await Lobby.find({ tournamentId })
      .populate("teamId", "name members")
      .lean();

    if (!lobbyEntries.length) {
      throw new Error("No teams joined this tournament yet");
    }

    /* =========================
       COLLECT UNIQUE PLAYER CONTACTS
       (Future notification system hook)
    ========================= */
    const recipients = new Set();

    lobbyEntries.forEach(entry => {
      if (entry.teamId?.members?.length) {
        entry.teamId.members.forEach(email => recipients.add(email));
      }
    });

    /* =========================
       STORE REMINDER LOG (AUDIT TRAIL)
    ========================= */
    await Reminder.create({
      tournamentId,
      adminId,
      type,
      scheduledFor: new Date(), // manual trigger time
      status: "sent",
    });

    /* =========================
       FUTURE PHASE 11 INTEGRATION POINT
       sendNotification([...recipients], message)
    ========================= */
    console.log("🔔 Manual Reminder Triggered:", {
      tournament: tournament.name,
      type,
      recipients: recipients.size,
    });

    return {
      success: true,
      recipients: recipients.size,
    };
  } catch (err) {
    console.error("❌ Manual reminder failed:", err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendManualReminder };
