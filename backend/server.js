// backend/server.js
// PHASE 1 – HARDENED & CLEAN SERVER ENTRY (PRODUCTION FINAL)
// Express • Security • Versioned API • Backward Compatible Auth • Jobs Safe

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const apiLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const HotSlot = require("./models/HotSlot");
const axios = require("axios");

const app = express();

/* =======================
   TRUST PROXY (Render)
======================= */
app.set("trust proxy", 1);

/* =======================
   DATABASE
======================= */
connectDB();

/* =======================
   GLOBAL SECURITY
======================= */
app.use(helmet());

/* =======================
   CORS (VERCEL + LOCAL SAFE)
======================= */
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://ff-india-tournaments.vercel.app",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

/* =======================
   BODY PARSERS
======================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =======================
   RATE LIMITING
======================= */
app.use(apiLimiter);

/* =======================
   API ROUTES (VERSIONED)
======================= */
const authRoutes = require("./routes/authRoutes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", require("./routes/userRoutes"));
app.use("/api/v1/team", require("./routes/teamRoutes"));
app.use("/api/v1/tournaments", require("./routes/tournamentRoutes"));
app.use("/api/v1/creator", require("./routes/creatorRoutes"));
app.use("/api/v1/payments", require("./routes/paymentRoutes"));
app.use("/api/v1/hot-slots", require("./routes/hotSlotRoutes"));
app.use("/api/v1/notifications", require("./routes/notificationRoutes"));

/* =====================================================
   🔁 BACKWARD COMPATIBILITY (DO NOT REMOVE)
   Fixes frontend calls like /auth/role
===================================================== */
app.use("/auth", authRoutes);

/* =======================
   ROOT & HEALTH
======================= */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "FF India Tournaments Backend",
    version: "1.0.0"
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
});
