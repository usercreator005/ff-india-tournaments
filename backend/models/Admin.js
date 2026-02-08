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

    // 👑 Role control (Creator = SUPER_ADMIN)
    role: {
      type: String,
      enum: ["ADMIN", "SUPER_ADMIN"],
      default: "ADMIN",
    },

    /* =========================
       OPTIONAL BRAND NAME
       Used in tournament banner footer
       "Presented by {orgName}"
    ========================= */
    orgName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    /* =========================
       ACCOUNT STATUS
       Future control (suspend/disable)
    ========================= */
    isActive: {
      type: Boolean,
      default: true,
    }
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
