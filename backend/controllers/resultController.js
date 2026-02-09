const Result = require("../models/Result");
const MatchRoom = require("../models/MatchRoom");

/* =======================================================
   🎯 OFFICIAL SCORING SYSTEM
   1 Kill = 1 Point
   Placement Points Map
======================================================= */
const placementPointsTable = {
  1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5,
  7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0,
};

const getPlacementPoints = (position) =>
  placementPointsTable[position] ?? 0;

/* =======================================================
   📌 UPSERT TEAM RESULT (PER MATCH)
======================================================= */
exports.upsertTeamResult = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { matchRoomId, teamId, position, kills = 0, notes = "" } = req.body;

    if (!matchRoomId || !teamId || position == null)
      return res.status(400).json({ message: "Missing required fields" });

    if (position < 1)
      return res.status(400).json({ message: "Invalid position value" });

    const matchRoom = await MatchRoom.findOne({ _id: matchRoomId, adminId });
    if (!matchRoom)
      return res.status(404).json({ message: "Match room not found" });

    const existing = await Result.findOne({ matchRoomId, teamId, adminId });
    if (existing && existing.isLocked)
      return res.status(400).json({ message: "Result already locked" });

    const placementPoints = getPlacementPoints(position);
    const killPoints = Number(kills);
    const totalPoints = placementPoints + killPoints;

    const result = await Result.findOneAndUpdate(
      { matchRoomId, teamId, adminId },
      {
        tournamentId: matchRoom.tournamentId,
        matchRoomId,
        teamId,
        position,
        kills: killPoints,
        points: totalPoints,
        notes,
        adminId,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      result,
      breakdown: { placementPoints, killPoints, totalPoints },
    });
  } catch (err) {
    console.error("Result upload error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   🔒 LOCK RESULTS FOR A MATCH
======================================================= */
exports.lockMatchResults = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { matchRoomId } = req.params;

    const results = await Result.find({ matchRoomId, adminId });
    if (!results.length)
      return res.status(404).json({ message: "No results found to lock" });

    await Result.updateMany(
      { matchRoomId, adminId },
      {
        $set: {
          isLocked: true,
          lockedAt: new Date(),
          verifiedBy: adminId,
        },
      }
    );

    res.json({ success: true, message: "Results locked successfully" });
  } catch (err) {
    console.error("Lock results error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   📊 MATCH LEADERBOARD (SINGLE MATCH)
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
   🏆 STAGE LEADERBOARD (MULTI-MATCH TOTAL)
   Sums all matches inside a stage
======================================================= */
exports.getStageLeaderboard = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { tournamentId, stageNumber } = req.params;

    // 1️⃣ Get all match rooms in this stage
    const rooms = await MatchRoom.find({
      tournamentId,
      stageNumber,
      adminId,
    }).select("_id");

    if (!rooms.length)
      return res.status(404).json({ message: "No matches found for this stage" });

    const roomIds = rooms.map(r => r._id);

    // 2️⃣ Aggregate total points & kills across all matches
    const leaderboard = await Result.aggregate([
      { $match: { matchRoomId: { $in: roomIds }, adminId } },
      {
        $group: {
          _id: "$teamId",
          totalPoints: { $sum: "$points" },
          totalKills: { $sum: "$kills" },
          matchesPlayed: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1, totalKills: -1 } },
    ]);

    // 3️⃣ Populate team info manually
    const Team = require("../models/Team");
    const populated = await Team.populate(leaderboard, {
      path: "_id",
      select: "name logo",
    });

    res.json({ success: true, leaderboard: populated });
  } catch (err) {
    console.error("Stage leaderboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   🗑 DELETE RESULT (Before Lock Only)
======================================================= */
exports.deleteTeamResult = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { resultId } = req.params;

    const result = await Result.findOne({ _id: resultId, adminId });
    if (!result)
      return res.status(404).json({ message: "Result not found" });

    if (result.isLocked)
      return res.status(400).json({ message: "Locked results cannot be deleted" });

    await result.deleteOne();

    res.json({ success: true, message: "Result deleted" });
  } catch (err) {
    console.error("Delete result error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
