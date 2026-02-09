const Reminder = require("../models/Reminder");
const Tournament = require("../models/Tournament");
const MatchRoom = require("../models/MatchRoom");

/* =======================================================
   ⏰ REMINDER PROCESSOR (RUNS EVERY MINUTE)
   This will later plug into Notification system (Phase 11)
======================================================= */

const processReminders = async () => {
  try {
    const now = new Date();

    // Fetch all pending reminders that are due
    const reminders = await Reminder.find({
      status: "pending",
      scheduledFor: { $lte: now },
    }).limit(50); // batch limit for safety

    for (const reminder of reminders) {
      try {
        /* =========================
           LOAD RELATED DATA
        ========================= */
        const tournament = await Tournament.findById(reminder.tournamentId);
        const matchRoom = reminder.matchRoomId
          ? await MatchRoom.findById(reminder.matchRoomId)
          : null;

        if (!tournament) {
          reminder.status = "failed";
          await reminder.save();
          continue;
        }

        /* =========================
           REMINDER TYPES
        ========================= */
        switch (reminder.type) {
          case "match_starting":
            console.log(
              `🔔 Reminder: Tournament "${tournament.name}" is starting soon.`
            );
            break;

          case "room_published":
            if (matchRoom) {
              console.log(
                `🏠 Room Published for Tournament "${tournament.name}" | Room ID: ${matchRoom.roomId}`
              );
            }
            break;

          default:
            console.log("Unknown reminder type:", reminder.type);
        }

        // Mark as sent (actual notification system will plug here later)
        reminder.status = "sent";
        await reminder.save();
      } catch (err) {
        console.error("Reminder processing failed:", err);
        reminder.status = "failed";
        await reminder.save();
      }
    }
  } catch (err) {
    console.error("Reminder scheduler error:", err);
  }
};

/* =======================================================
   START SCHEDULER LOOP
   Runs every 60 seconds
======================================================= */
const startReminderScheduler = () => {
  console.log("⏰ Reminder Scheduler Started...");
  setInterval(processReminders, 60 * 1000);
};

module.exports = { startReminderScheduler };
