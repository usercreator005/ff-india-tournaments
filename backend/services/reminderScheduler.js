const Reminder = require("../models/Reminder");
const Tournament = require("../models/Tournament");
const MatchRoom = require("../models/MatchRoom");

/* =======================================================
   ⏰ REMINDER PROCESSOR (RUNS EVERY MINUTE)
   Phase 7: Automated tournament reminders
   Phase 11: Will plug into Notification system
======================================================= */

const BATCH_SIZE = 50;

const processReminders = async () => {
  try {
    const now = new Date();

    // Fetch due reminders safely (oldest first)
    const reminders = await Reminder.find({
      status: "pending",
      scheduledFor: { $lte: now },
    })
      .sort({ scheduledFor: 1 })
      .limit(BATCH_SIZE);

    if (!reminders.length) return;

    for (const reminder of reminders) {
      try {
        /* =========================
           LOAD RELATED DATA
        ========================= */
        const tournament = await Tournament.findById(reminder.tournamentId).lean();
        const matchRoom = reminder.matchRoomId
          ? await MatchRoom.findById(reminder.matchRoomId).lean()
          : null;

        if (!tournament) {
          reminder.status = "failed";
          reminder.error = "Tournament not found";
          await reminder.save();
          continue;
        }

        /* =========================
           REMINDER TYPES
        ========================= */
        switch (reminder.type) {
          case "match_starting":
            console.log(
              `🔔 [MATCH STARTING] Tournament "${tournament.name}" begins at ${tournament.startTime}`
            );
            break;

          case "room_published":
            if (matchRoom) {
              console.log(
                `🏠 [ROOM LIVE] Tournament "${tournament.name}" | Room ID: ${matchRoom.roomId}`
              );
            } else {
              console.log(
                `🏠 [ROOM LIVE] Tournament "${tournament.name}" | Room info missing`
              );
            }
            break;

          default:
            console.log("⚠ Unknown reminder type:", reminder.type);
        }

        /* =========================
           FUTURE HOOK (Phase 11)
           sendNotification(reminder)
        ========================= */

        reminder.status = "sent";
        reminder.sentAt = new Date();
        await reminder.save();
      } catch (err) {
        console.error("❌ Reminder processing failed:", err);
        reminder.status = "failed";
        reminder.error = err.message;
        await reminder.save();
      }
    }
  } catch (err) {
    console.error("🚨 Reminder scheduler fatal error:", err);
  }
};

/* =======================================================
   START SCHEDULER LOOP
======================================================= */
const startReminderScheduler = () => {
  console.log("⏰ Reminder Scheduler Started...");
  setInterval(processReminders, 60 * 1000);
};

module.exports = { startReminderScheduler };
