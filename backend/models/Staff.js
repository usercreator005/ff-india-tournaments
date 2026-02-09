const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const staffSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC INFO
    ========================= */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // 🔒 Never return password by default
    },

    /* =========================
       ROLE & PERMISSIONS
    ========================= */
    role: {
      type: String,
      enum: ["result_manager", "support_staff", "tournament_manager"],
      default: "result_manager",
    },

    permissions: {
      canManageResults: { type: Boolean, default: false },
      canManageTournaments: { type: Boolean, default: false },
      canHandleSupport: { type: Boolean, default: false },
    },

    /* =========================
       ACCOUNT STATUS
    ========================= */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* =========================
       🔐 ADMIN DATA BOUNDARY
    ========================= */
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* =========================
   INDEXES
========================= */

// Fast admin filtering
staffSchema.index({ adminId: 1 });

// Unique email per admin (NOT global)
staffSchema.index({ email: 1, adminId: 1 }, { unique: true });

/* =========================
   🔐 PASSWORD HASHING
========================= */
staffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* =========================
   🎯 AUTO-SET PERMISSIONS BASED ON ROLE
========================= */
staffSchema.pre("save", function (next) {
  if (!this.isModified("role")) return next();

  if (this.role === "result_manager") {
    this.permissions.canManageResults = true;
  }

  if (this.role === "tournament_manager") {
    this.permissions.canManageTournaments = true;
  }

  if (this.role === "support_staff") {
    this.permissions.canHandleSupport = true;
  }

  next();
});

/* =========================
   🔎 PASSWORD COMPARE METHOD
========================= */
staffSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Staff", staffSchema);
