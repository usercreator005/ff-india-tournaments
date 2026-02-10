const Tournament = require("../models/Tournament");
const Staff = require("../models/Staff");

/* =======================================================
   📊 PHASE 12 — ADMIN PROFILE DASHBOARD
   Shows admin personal info + platform stats
======================================================= */
exports.getAdminDashboard = async (req, res) => {
  try {
    const adminId = req.admin._id;

    /* ================= ADMIN BASIC INFO ================= */
    const adminInfo = {
      name: req.admin.name,
      email: req.admin.email,
    };

    /* ================= TOURNAMENT STATS ================= */
    const totalTournaments = await Tournament.countDocuments({ adminId });

    const liveTournaments = await Tournament.countDocuments({
      adminId,
      status: "ongoing",
    });

    const upcomingTournaments = await Tournament.countDocuments({
      adminId,
      status: "upcoming",
    });

    const pastTournaments = await Tournament.countDocuments({
      adminId,
      status: "past",
    });

    /* ============ TOTAL PRIZE POOL DISTRIBUTED ============ */
    const prizePoolAgg = await Tournament.aggregate([
      { $match: { adminId } },
      {
        $group: {
          _id: null,
          totalPrizePool: { $sum: "$prizePool" },
        },
      },
    ]);

    const totalPrizePool = prizePoolAgg.length > 0 ? prizePoolAgg[0].totalPrizePool : 0;

    /* ================= STAFF COUNT ================= */
    const totalStaff = await Staff.countDocuments({ adminId, isActive: true });

    res.json({
      success: true,
      dashboard: {
        admin: adminInfo,
        tournaments: {
          total: totalTournaments,
          live: liveTournaments,
          upcoming: upcomingTournaments,
          past: pastTournaments,
        },
        totalPrizePool,
        totalStaff,
      },
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
