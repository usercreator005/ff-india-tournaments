const mongoose = require("mongoose");

const ticketReplySchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    senderRole: { type: String, enum: ["user", "staff", "admin"], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    /* =========================
       USER INFO
    ========================= */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userEmail: {
      type: String,
      required: true,
      index: true,
    },

    /* =========================
       TICKET DETAILS
    ========================= */
    subject: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["payment", "match_issue", "account", "other"],
      default: "other",
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    /* =========================
       CONVERSATION THREAD
    ========================= */
    replies: [ticketReplySchema],

    /* =========================
       ASSIGNED STAFF (OPTIONAL)
    ========================= */
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },

    /* =========================
       🔐 ADMIN DATA BOUNDARY
    ========================= */
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* =========================
   INDEXES
========================= */

supportTicketSchema.index({ adminId: 1, status: 1 });
supportTicketSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
