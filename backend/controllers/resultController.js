const Result = require("../models/Result");
const MatchRoom = require("../models/MatchRoom");
const Tournament = require("../models/Tournament");

/* =======================================================
   📌 UPLOAD / UPDATE TEAM RESULT
   Admin enters kills, position, points
======================================================= */
exports.upsertTeamResult = async (req, res) => {
  try {
    const adminId = req.admin._id; // from auth middleware
    const { matchRoomId, teamId, position, kills, points } = req.body;

    if (!matchRoomId || !teamId || position == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const matchRoom = await MatchRoom.findOne({ _id: matchRoomId, adminId });
    if (!matchRoom) {
      return res.status(404).json({ message: "Match room not found" });
    }

    // Check if result already locked
    const existing = await Result.findOne({ matchRoomId, teamId, adminId });
    if (existing && existing.isLocked) {
      return res.status(400).json({ message: "Result already locked" });
    }

    const result = await Result.findOneAndUpdate(
      { matchRoomId, teamId, adminId },
      {
        tournamentId: matchRoom.tournamentId,
        matchRoomId,
        teamId,
        position,
        kills: kills || 0,
        points: points || 0,
        adminId,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, result });
  } catch (err) {
    console.error("Result upload error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   🔒 LOCK RESULTS FOR A MATCH
   Prevents further edits
======================================================= */
exports.lockMatchResults = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { matchRoomId } = req.params;

    const results = await Result.find({ matchRoomId, adminId });
    if (!results.length) {
      return res.status(404).json({ message: "No results found to lock" });
    }

    await Result.updateMany(
      { matchRoomId, adminId },
      { $set: { isLocked: true } }
    );

    res.json({ success: true, message: "Results locked successfully" });
  } catch (err) {
    console.error("Lock results error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   📊 GET MATCH LEADERBOARD
   Sorted by points desc, then kills desc
======================================================= */
exports.getMatchLeaderboard = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { matchRoomId } = req.params;

    const leaderboard = await Result.find({ matchRoomId, adminId })
      .populate("teamId", "name logo")
      .sort({ points: -1, kills: -1 });

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   🗑 DELETE RESULT (before locking only)
======================================================= */
exports.deleteTeamResult = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { resultId } = req.params;

    const result = await Result.findOne({ _id: resultId, adminId });
    if (!result) return res.status(404).json({ message: "Result not found" });

    if (result.isLocked) {
      return res.status(400).json({ message: "Locked results cannot be deleted" });
    }

    await result.deleteOne();

    res.json({ success: true, message: "Result deleted" });
  } catch (err) {
    console.error("Delete result error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
