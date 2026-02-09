const Reminder = require("../models/Reminder");

/* =======================================================
   📌 CREATE MATCH START REMINDER
   Called when tournament is created/updated
======================================================= */
exports.scheduleMatchStartReminder = async ({
  tournamentId,
  adminId,
  startTime,
}) => {
  try {
    // Reminder 15 minutes before match start
    const reminderTime = new Date(new Date(startTime).getTime() - 15 * 60 * 1000);

    if (reminderTime <= new Date()) return; // Don't schedule past reminders

    await Reminder.create({
      tournamentId,
      adminId,
      type: "match_starting",
      scheduledFor: reminderTime,
    });

    console.log("✅ Match start reminder scheduled");
  } catch (err) {
    console.error("Failed to schedule match start reminder:", err);
  }
};

/* =======================================================
   📌 CREATE ROOM PUBLISH REMINDER
   Called when admin publishes match room
======================================================= */
exports.scheduleRoomPublishReminder = async ({
  tournamentId,
  matchRoomId,
  adminId,
}) => {
  try {
    await Reminder.create({
      tournamentId,
      matchRoomId,
      adminId,
      type: "room_published",
      scheduledFor: new Date(), // immediate trigger
    });

    console.log("✅ Room publish reminder scheduled");
  } catch (err) {
    console.error("Failed to schedule room publish reminder:", err);
  }
};
