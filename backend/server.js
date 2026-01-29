const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const apiLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const app = express();

/* =======================
   Database Connection
======================= */
connectDB();

/* =======================
   Global Middlewares
======================= */
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json({ limit: "10kb" })); // Prevent payload abuse

// Rate limiting (applies to all APIs)
app.use(apiLimiter);

/* =======================
   Routes
======================= */
app.use("/auth", require("./routes/authRoutes"));
app.use("/teams", require("./routes/teamRoutes"));
app.use("/tournaments", require("./routes/tournamentRoutes"));
app.use("/creator", require("./routes/creatorRoutes"));
app.use("/payments", require("./routes/paymentRoutes"));
app.use("/hot-slots", require("./routes/hotSlotRoutes"));

/* =======================
   Health Check
======================= */
app.get("/", (req, res) => {
  res.status(200).send("FF INDIA TOURNAMENTS BACKEND RUNNING");
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
