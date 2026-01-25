const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: String,
  name: String,
  email: { type: String, unique: true },
  role: { type: String, default: "user" },
  teamId: { type: String, default: null }
});

module.exports = mongoose.model("User", userSchema);
