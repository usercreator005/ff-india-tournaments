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

    // 👑 Role control
    role: {
      type: String,
      enum: ["ADMIN", "SUPER_ADMIN"],
      default: "ADMIN",
    },

    // 🏢 Organization Scope (Only for normal ADMIN)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: function () {
        return this.role === "ADMIN"; // SUPER_ADMIN doesn't need org
      },
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =========================
   UNIQUE ORG ADMIN RULE
   One organization → One admin
========================= */
adminSchema.index(
  { organizationId: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "ADMIN" }, // applies only to ADMIN
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
