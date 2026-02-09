const TournamentScoring = require("../models/TournamentScoring");
const Tournament = require("../models/Tournament");

/* =======================================================
   🎯 SET / UPDATE SCORING RULES FOR TOURNAMENT
   Supports custom placement table + kill value
======================================================= */
exports.setTournamentScoring = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const {
      tournamentId,
      placementPoints,   // {1:12, 2:9, ...}
      killPointValue     // usually 1
    } = req.body;

    if (!tournamentId) {
      return res.status(400).json({ message: "Tournament ID required" });
    }

    const tournament = await Tournament.findOne({ _id: tournamentId, adminId });
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Basic validation
    if (!placementPoints || typeof placementPoints !== "object") {
      return res.status(400).json({ message: "placementPoints must be an object" });
    }

    const scoring = await TournamentScoring.findOneAndUpdate(
      { tournamentId, adminId },
      {
        tournamentId,
        placementPoints,
        killPointValue: killPointValue ?? 1,
        adminId,
        updatedAt: new Date(),
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
   📊 GET SCORING RULES FOR TOURNAMENT
   Falls back to default system if not set
======================================================= */
exports.getTournamentScoring = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { tournamentId } = req.params;

    const scoring = await TournamentScoring.findOne({ tournamentId, adminId });

    if (!scoring) {
      return res.json({
        success: true,
        scoring: {
          placementPoints: {
            1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5,
            7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0
          },
          killPointValue: 1,
          isDefault: true
        }
      });
    }

    res.json({ success: true, scoring });
  } catch (err) {
    console.error("Scoring fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
