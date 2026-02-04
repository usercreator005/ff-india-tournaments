const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const apiLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const HotSlot = require("./models/HotSlot"); // 🔥 C5.3

const axios = require("axios"); // ✅ Self-Ping

const app = express();

/* =======================
   TRUST PROXY (Render)
======================= */
app.set("trust proxy", 1);

/* =======================
   Database Connection
======================= */
connectDB();

/* =======================
   Global Middlewares
======================= */
app.use(helmet());

/* =======================
   CORS (🔥 PATCH FIXED)
======================= */
const corsOptions = {
  origin: [
    "https://ff-india-tournaments.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* =======================
   Body Parsers
======================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =======================
   Rate Limiting
======================= */
app.use(apiLimiter);

/* =======================
   Routes
======================= */
app.use("/auth", require("./routes/authRoutes"));
app.use("/user", require("./routes/userRoutes"));
app.use("/team", require("./routes/teamRoutes"));
app.use("/tournaments", require("./routes/tournamentRoutes"));
app.use("/creator", require("./routes/creatorRoutes"));
app.use("/payments", require("./routes/paymentRoutes"));
app.use("/hot-slots", require("./routes/hotSlotRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));

/* =======================
   Health & Root
======================= */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "FF India Tournaments Backend Running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ success: true });
});

/* =======================
   🔥 C5.3 AUTO CLEANUP JOB
   Expired Hot Slots
======================= */
const startHotSlotCleanup = () => {
  const ONE_HOUR = 60 * 60 * 1000;

  setInterval(async () => {
    try {
      const now = new Date();

      const result = await HotSlot.deleteMany({
        expiresAt: { $lte: now }
      });

      if (result.deletedCount > 0) {
        console.log(
          `🧹 HotSlot Cleanup: ${result.deletedCount} expired slots removed`
        );
      }
    } catch (err) {
      console.error("❌ HotSlot Cleanup Error:", err.message);
    }
  }, ONE_HOUR);
};

/* =======================
   🔥 SELF-PING FUNCTION
   Keep backend awake
======================= */
const startSelfPing = () => {
  const BACKEND_URL = "https://ff-india-tournaments.onrender.com/health";

  const pingBackend = async () => {
    try {
      const res = await axios.get(BACKEND_URL, { timeout: 15000 });
      console.log("✅ Self ping successful at", new Date().toLocaleTimeString(), "Status:", res.status);
    } catch (err) {
      console.log("❌ Self ping failed at", new Date().toLocaleTimeString(), err.message);
    }
  };

  // Ping immediately
  pingBackend();

  // Ping every 10 minutes
  setInterval(pingBackend, 10 * 60 * 1000);
};

/* =======================
   Error Handler (LAST)
======================= */
app.use(errorHandler);

/* =======================
   Server
======================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  startHotSlotCleanup(); // ✅ START CLEANUP AFTER SERVER START
  startSelfPing();       // ✅ START SELF-PING AFTER SERVER START
});
