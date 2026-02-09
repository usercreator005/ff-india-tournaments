// backend/services/stageScoringService.js

const Result = require("../models/Result");

/* =======================================================
   🎯 STAGE SCORING SERVICE
   Aggregates multiple match results into stage leaderboard
======================================================= */

/**
 * Generate stage leaderboard from multiple matchRoomIds
 * @param {Array} matchRoomIds - Array of match room IDs in this stage
 * @param {String} adminId - Admin boundary
 */
exports.generateStageLeaderboard = async (matchRoomIds, adminId) => {
  if (!Array.isArray(matchRoomIds) || matchRoomIds.length === 0) {
    throw new Error("matchRoomIds array required");
  }

  const results = await Result.find({
    matchRoomId: { $in: matchRoomIds },
    adminId,
  }).lean();

  const teamStats = {};

  for (const r of results) {
    const teamId = r.teamId.toString();

    if (!teamStats[teamId]) {
      teamStats[teamId] = {
        teamId,
        totalPoints: 0,
        totalKills: 0,
        matchesPlayed: 0,
      };
    }

    teamStats[teamId].totalPoints += r.points || 0;
    teamStats[teamId].totalKills += r.kills || 0;
    teamStats[teamId].matchesPlayed += 1;
  }

  const leaderboard = Object.values(teamStats).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.totalKills - a.totalKills;
  });

  return leaderboard;
};
