const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use("/teams", require("./routes/teamRoutes"));
app.use("/tournaments", require("./routes/tournamentRoutes"));
app.use("/creator", require("./routes/creatorRoutes"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/hot-slots", require("./routes/hotSlotRoutes"));
app.get("/", (req, res) => {
  res.send("FF INDIA TOURNAMENTS BACKEND RUNNING");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
