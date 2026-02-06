// js/creator.js
// CREATOR DASHBOARD – PHASE 1 STABILIZED
// Secure Auth Guard • Clean API Layer • No Role Escapes

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* =========================
   CONFIG
========================= */
const BACKEND_URL = "https://ff-india-tournaments.onrender.com";
let sessionToken = null;

/* =========================
   DOM REFERENCES
========================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("creatorSidebar");
const overlay = document.getElementById("creatorOverlay");
const logoutBtn = document.getElementById("logoutBtn");

const creatorName = document.getElementById("creatorName");
const creatorEmail = document.getElementById("creatorEmail");

/* =========================
   SIDEBAR TOGGLE
========================= */
function openSidebar(e) {
  e?.stopPropagation();
  sidebar.classList.remove("hidden");
  overlay.classList.remove("hidden");
  requestAnimationFrame(() => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
  });
}

function closeSidebar() {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
  setTimeout(() => {
    sidebar.classList.add("hidden");
    overlay.classList.add("hidden");
  }, 300);
}

avatar?.addEventListener("click", openSidebar);
overlay?.addEventListener("click", closeSidebar);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeSidebar();
});

/* =========================
   LOGOUT
========================= */
logoutBtn?.addEventListener("click", async () => {
  if (!confirm("Logout from Creator Panel?")) return;
  await signOut(auth);
  window.location.replace("index.html");
});

/* =========================
   AUTH GUARD (CREATOR ONLY)
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("index.html");
    return;
  }

  try {
    sessionToken = await getIdToken(user, true);

    const role = await verifyCreator(sessionToken);
    if (role !== "creator") throw new Error("Unauthorized");

    creatorName.textContent = user.displayName || "Creator";
    creatorEmail.textContent = user.email || "";

    initCreatorPanel();

  } catch (err) {
    console.error("Creator access denied:", err);
    await signOut(auth);
    window.location.replace("index.html");
  }
});

/* =========================
   VERIFY ROLE
========================= */
async function verifyCreator(token) {
  const res = await fetch(`${BACKEND_URL}/auth/role`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Role check failed");
  const data = await res.json();
  return data.role;
}

/* =========================
   INIT DASHBOARD
========================= */
function initCreatorPanel() {
  fetchStats();
  fetchAdmins();
  fetchMyHotSlots();
}

/* =========================
   API HELPER
========================= */
async function api(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "API error");
  }

  return res.json();
}

/* =========================
   HOT SLOT UI
========================= */
const contactInput = document.getElementById("contactNumber");
const dmNumber = document.getElementById("dmNumber");

contactInput?.addEventListener("input", () => {
  dmNumber.textContent = contactInput.value || "Not Set";
});

dmNumber?.addEventListener("click", () => {
  if (contactInput.value.length === 10) {
    window.open(`https://wa.me/91${contactInput.value}`, "_blank");
  }
});

/* =========================
   POST HOT SLOT
========================= */
document.getElementById("postSlot")?.addEventListener("click", async () => {
  const payload = {
    tournamentName: slotTournament.value.trim(),
    prizePool: slotPrize.value.trim(),
    stage: slotStage.value.trim(),
    description: slotDetails.value.trim(),
    contact: contactInput.value.trim()
  };

  if (!payload.tournamentName || !payload.stage || payload.contact.length !== 10) {
    alert("Fill all fields correctly");
    return;
  }

  try {
    await api("/creator/hot-slot", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    alert("Hot slot posted");
    slotTournament.value = slotPrize.value = slotStage.value = slotDetails.value = "";
    contactInput.value = "";
    dmNumber.textContent = "Not Set";

    fetchMyHotSlots();

  } catch {
    alert("Failed to post hot slot");
  }
});

/* =========================
   CREATE ADMIN
========================= */
document.getElementById("addAdmin")?.addEventListener("click", async () => {
  const name = adminName.value.trim();
  const email = adminEmail.value.trim();
  if (!name || !email) return alert("Enter admin details");

  try {
    await api("/creator/create-admin", {
      method: "POST",
      body: JSON.stringify({ name, email })
    });

    adminName.value = adminEmail.value = "";
    fetchAdmins();

  } catch {
    alert("Admin creation failed");
  }
});

/* =========================
   FETCH ADMINS
========================= */
async function fetchAdmins() {
  try {
    const data = await api("/creator/stats");
    const list = document.getElementById("adminList");
    list.innerHTML = "";

    (data.admins || []).forEach(admin => {
      const li = document.createElement("li");
      li.textContent = `${admin.email} ❌`;

      li.onclick = async () => {
        if (!confirm(`Remove ${admin.email}?`)) return;
        await api(`/creator/remove-admin/${admin.email}`, { method: "DELETE" });
        fetchAdmins();
      };

      list.appendChild(li);
    });
  } catch {}
}

/* =========================
   FETCH HOT SLOTS
========================= */
async function fetchMyHotSlots() {
  try {
    const data = await api("/creator/hot-slots");
    const list = document.getElementById("hotSlotList");
    const empty = document.getElementById("hotSlotEmpty");

    list.innerHTML = "";

    if (!data.slots?.length) {
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    data.slots.forEach(slot => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${slot.tournamentName}</strong><br>
        Stage: ${slot.stage}<br>
        Prize: ${slot.prizePool}<br>
        ${slot.expired ? "⛔ Expired" : "✅ Active"}
      `;
      list.appendChild(li);
    });
  } catch {}
}

/* =========================
   FETCH STATS
========================= */
async function fetchStats() {
  try {
    const data = await api("/creator/stats");
    totalUsers.textContent = data.totalUsers || 0;
    activeTournaments.textContent = data.activeHotSlots || 0;
    totalAdmins.textContent = data.admins?.length || 0;
  } catch {}
  }
