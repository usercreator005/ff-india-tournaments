const mongoose = require("mongoose");

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
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
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
    },

    /* =========================
       🔐 ADMIN DATA BOUNDARY
       Staff always belongs to ONE admin
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

// Fast lookup by admin
staffSchema.index({ adminId: 1 });

// Prevent duplicate staff emails under same admin
staffSchema.index({ email: 1, adminId: 1 }, { unique: true });

module.exports = mongoose.model("Staff", staffSchema);
