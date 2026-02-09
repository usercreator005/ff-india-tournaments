const TournamentScoring = require("../models/TournamentScoring");
const Tournament = require("../models/Tournament");

/* =======================================================
   🎯 SET / UPDATE SCORING RULES FOR TOURNAMENT
======================================================= */
exports.setTournamentScoring = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { tournamentId, placementPoints, killPointValue } = req.body;

    if (!tournamentId) {
      return res.status(400).json({ message: "Tournament ID required" });
    }

    const tournament = await Tournament.findOne({ _id: tournamentId, adminId });
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const scoring = await TournamentScoring.findOneAndUpdate(
      { tournamentId, adminId },
      {
        tournamentId,
        placementPoints,
        killPointValue,
        adminId,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, scoring });
  } catch (err) {
    console.error("Scoring setup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   📊 GET SCORING RULES
======================================================= */
exports.getTournamentScoring = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { tournamentId } = req.params;

    const scoring = await TournamentScoring.findOne({ tournamentId, adminId });

    res.json({ success: true, scoring });
  } catch (err) {
    console.error("Scoring fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
