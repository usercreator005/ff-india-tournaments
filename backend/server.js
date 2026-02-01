const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const apiLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

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
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ PATCH ADDED
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// Apply CORS globally
app.use(cors(corsOptions));

// ✅ Explicit preflight support (VERY IMPORTANT)
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
app.use("/user", require("./routes/userRoutes")); // Avatar PATCH route
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
   Error Handler (LAST)
======================= */
app.use(errorHandler);

/* =======================
   Server
======================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
