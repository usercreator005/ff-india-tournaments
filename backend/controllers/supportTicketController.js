const SupportTicket = require("../models/SupportTicket");

/* =======================================================
   🎫 CREATE TICKET (USER)
======================================================= */
exports.createTicket = async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({ success: false, message: "Only users can create tickets" });
    }

    const { subject, category, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      userEmail: req.user.email,
      subject,
      category,
      priority,
      adminId: req.user.adminId, // ensures admin boundary
      replies: [
        {
          message,
          senderRole: "user",
          senderId: req.user._id,
        },
      ],
    });

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    console.error("Create ticket error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   📋 GET MY TICKETS (USER)
======================================================= */
exports.getMyTickets = async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(403).json({ success: false });
    }

    const tickets = await SupportTicket.find({ userId: req.user._id })
      .sort({ updatedAt: -1 });

    res.json({ success: true, tickets });
  } catch (err) {
    console.error("Fetch user tickets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   🧑‍💼 GET ALL TICKETS (ADMIN / SUPPORT STAFF)
======================================================= */
exports.getAllTickets = async (req, res) => {
  try {
    const adminId = req.admin?._id || req.staff?.adminId;

    if (!adminId) {
      return res.status(403).json({ success: false });
    }

    const { status } = req.query;

    const filter = { adminId };
    if (status) filter.status = status;

    const tickets = await SupportTicket.find(filter)
      .populate("assignedStaffId", "name email")
      .sort({ updatedAt: -1 });

    res.json({ success: true, tickets });
  } catch (err) {
    console.error("Fetch tickets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   💬 REPLY TO TICKET (USER / STAFF / ADMIN)
======================================================= */
exports.replyToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Reply message required" });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    let senderRole, senderId, adminId;

    if (req.role === "user") {
      if (ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not your ticket" });
      }
      senderRole = "user";
      senderId = req.user._id;
      adminId = ticket.adminId;
    } else if (req.admin) {
      senderRole = "admin";
      senderId = req.admin._id;
      adminId = req.admin._id;
    } else if (req.staff) {
      senderRole = "staff";
      senderId = req.staff._id;
      adminId = req.staff.adminId;
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (ticket.adminId.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    ticket.replies.push({ message, senderRole, senderId });

    if (senderRole !== "user" && ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    res.json({ success: true, ticket });
  } catch (err) {
    console.error("Reply ticket error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================================================
   🔄 UPDATE TICKET STATUS (ADMIN / SUPPORT STAFF)
======================================================= */
exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!["open", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const adminId = req.admin?._id || req.staff?.adminId;
    if (!adminId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const ticket = await SupportTicket.findOne({ _id: ticketId, adminId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.status = status;
    await ticket.save();

    res.json({ success: true, ticket });
  } catch (err) {
    console.error("Update ticket status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
