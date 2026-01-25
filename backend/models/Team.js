const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: String,
  leaderEmail: String,
  members: [String]
});

module.exports = mongoose.model("Team", teamSchema);
