// backend/server.js
// PHASE 1–12 – HARDENED & CLEAN SERVER ENTRY (PRODUCTION SAFE)

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const apiLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const HotSlot = require("./models/HotSlot");
const axios = require("axios");

/* 🆕 PHASE 7 — REMINDER SCHEDULER */
const startReminderScheduler = require("./services/reminderScheduler"); // ✅ FIXED IMPORT

const app = express();

/* =======================
   TRUST PROXY (Render/Cloud)
======================= */
app.set("trust proxy", 1);

/* =======================
   DATABASE
======================= */
connectDB();

/* =======================
   GLOBAL SECURITY
======================= */
app.use(helmet({ crossOriginResourcePolicy: false }));

/* =======================
   CORS (FRONTEND SAFE)
======================= */
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://ff-india-tournaments.vercel.app",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

/* =======================
   BODY PARSERS
======================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =======================
   RATE LIMITING
======================= */
app.use(apiLimiter);

/* =======================
   API ROUTES (VERSIONED)
======================= */
const authRoutes = require("./routes/authRoutes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin/tournaments", require("./routes/adminTournamentManageRoutes"));
app.use("/api/v1/user", require("./routes/userRoutes"));
app.use("/api/v1/team", require("./routes/teamRoutes"));
app.use("/api/v1/tournaments", require("./routes/tournamentRoutes"));
app.use("/api/v1/creator", require("./routes/creatorRoutes"));
app.use("/api/v1/payments", require("./routes/paymentRoutes"));
app.use("/api/v1/hot-slots", require("./routes/hotSlotRoutes"));
app.use("/api/v1/notifications", require("./routes/notificationRoutes"));
app.use("/api/v1/results", require("./routes/resultRoutes"));
app.use("/api/v1/scoring", require("./routes/tournamentScoringRoutes"));
app.use("/api/v1/stage-results", require("./routes/stageResultRoutes"));
app.use("/api/v1/rooms", require("./routes/matchRoomRoutes"));
app.use("/api/v1/reminders", require("./routes/reminderRoutes"));

/* 🆕 PHASE 10 — STAFF MANAGEMENT */
app.use("/api/v1/admin/staff", require("./routes/staffManagementRoutes"));

/* 🆕 PHASE 12 — ADMIN PROFILE DASHBOARD */
app.use("/api/v1/admin/dashboard", require("./routes/adminDashboardRoutes"));

/* 🔁 BACKWARD COMPATIBILITY */
app.use("/auth", authRoutes);

/* =======================
   ROOT & HEALTH
======================= */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "FF India Tournaments Backend",
    version: "1.4.0"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ success: true });
});

/* =======================
   🔥 HOT SLOT CLEANUP JOB
======================= */
function startHotSlotCleanup() {
  const ONE_HOUR = 60 * 60 * 1000;

  setInterval(async () => {
    try {
      const now = new Date();
      const result = await HotSlot.deleteMany({
        expiresAt: { $lte: now }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 HotSlot cleanup: ${result.deletedCount} removed`);
      }
    } catch (err) {
      console.error("❌ HotSlot cleanup error:", err.message);
    }
  }, ONE_HOUR);
}

/* =======================
   🔁 OPTIONAL SELF-PING
======================= */
function startSelfPing() {
  if (process.env.ENABLE_SELF_PING !== "true") return;

  const URL =
    process.env.BACKEND_HEALTH_URL ||
    `http://localhost:${process.env.PORT || 5000}/health`;

  const ping = async () => {
    try {
      await axios.get(URL, { timeout: 15000 });
      console.log("✅ Self-ping OK", new Date().toLocaleTimeString());
    } catch (err) {
      console.log("❌ Self-ping failed:", err.message);
    }
  };

  ping();
  setInterval(ping, 10 * 60 * 1000);
}

/* =======================
   ERROR HANDLER (LAST)
======================= */
app.use(errorHandler);

/* =======================
   SERVER START
======================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);

  startHotSlotCleanup();
  startSelfPing();
  startReminderScheduler(); // ✅ WILL WORK NOW
});
