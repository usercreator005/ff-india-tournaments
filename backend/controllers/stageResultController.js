const StageResult = require("../models/StageResult");
const Result = require("../models/Result");
const MatchRoom = require("../models/MatchRoom");

/* =======================================================
   📊 GENERATE STAGE LEADERBOARD
   Combines multiple match results into one stage result
   Admin provides: tournamentId, stageNumber, matchRoomIds[]
======================================================= */
exports.generateStageResults = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { tournamentId, stageNumber, matchRoomIds } = req.body;

    if (!tournamentId || !stageNumber || !Array.isArray(matchRoomIds) || !matchRoomIds.length) {
      return res.status(400).json({ message: "tournamentId, stageNumber and matchRoomIds required" });
    }

    /* 🔐 Validate match rooms belong to admin & tournament */
    const rooms = await MatchRoom.find({
      _id: { $in: matchRoomIds },
      tournamentId,
      adminId,
    });

    if (rooms.length !== matchRoomIds.length) {
      return res.status(400).json({ message: "Invalid match rooms provided" });
    }

    /* 📥 Fetch all results from these matches */
    const matchResults = await Result.find({
      matchRoomId: { $in: matchRoomIds },
      adminId,
      isLocked: true, // Only locked matches allowed
    });

    if (!matchResults.length) {
      return res.status(400).json({ message: "No locked results found for these matches" });
    }

    /* 🧮 Aggregate team stats */
    const teamStats = {};

    for (const r of matchResults) {
      const key = r.teamId.toString();

      if (!teamStats[key]) {
        teamStats[key] = {
          teamId: r.teamId,
          matchesPlayed: 0,
          totalKills: 0,
          totalPoints: 0,
        };
      }

      teamStats[key].matchesPlayed += 1;
      teamStats[key].totalKills += r.kills;
      teamStats[key].totalPoints += r.points;
    }

    /* 🏆 Convert to array & sort */
    const leaderboard = Object.values(teamStats).sort(
      (a, b) => b.totalPoints - a.totalPoints || b.totalKills - a.totalKills
    );

    /* 💾 Save / Update Stage Results */
    for (let i = 0; i < leaderboard.length; i++) {
      const team = leaderboard[i];

      await StageResult.findOneAndUpdate(
        {
          tournamentId,
          stageNumber,
          teamId: team.teamId,
          adminId,
        },
        {
          ...team,
          rank: i + 1,
          adminId,
        },
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: "Stage results generated",
      teams: leaderboard.length,
    });
  } catch (err) {
    console.error("Stage result generation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   🏆 GET STAGE LEADERBOARD
======================================================= */
exports.getStageLeaderboard = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { tournamentId, stageNumber } = req.params;

    const results = await StageResult.find({
      tournamentId,
      stageNumber,
      adminId,
    })
      .populate("teamId", "name logo")
      .sort({ rank: 1 });

    res.json({ success: true, leaderboard: results });
  } catch (err) {
    console.error("Fetch stage leaderboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   🎯 MARK QUALIFIED TEAMS
   Admin selects top N teams
======================================================= */
exports.markStageQualified = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { tournamentId, stageNumber, qualifyCount } = req.body;

    if (!qualifyCount || qualifyCount < 1) {
      return res.status(400).json({ message: "qualifyCount required" });
    }

    const topTeams = await StageResult.find({
      tournamentId,
      stageNumber,
      adminId,
    })
      .sort({ rank: 1 })
      .limit(qualifyCount);

    const teamIds = topTeams.map(t => t.teamId);

    await StageResult.updateMany(
      { tournamentId, stageNumber, adminId },
      { $set: { qualified: false } }
    );

    await StageResult.updateMany(
      { tournamentId, stageNumber, adminId, teamId: { $in: teamIds } },
      { $set: { qualified: true } }
    );

    res.json({ success: true, qualifiedTeams: teamIds.length });
  } catch (err) {
    console.error("Qualification marking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
