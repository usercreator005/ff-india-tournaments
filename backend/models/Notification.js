const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  email: String,
  message: String,
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
