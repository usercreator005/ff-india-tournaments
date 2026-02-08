const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    // 🔐 Each admin has their OWN organization space
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true, // ensures one admin = one organization
      index: true,
    },

    // 👑 Role control
    role: {
      type: String,
      enum: ["ADMIN", "SUPER_ADMIN"],
      default: "ADMIN",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =========================
   PRE SAVE SAFETY
========================= */
adminSchema.pre("save", function (next) {
  this.email = this.email.toLowerCase().trim();
  next();
});

module.exports = mongoose.model("Admin", adminSchema);
