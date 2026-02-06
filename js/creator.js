// js/creator.js
// CREATOR DASHBOARD – FINAL PRODUCTION BUILD
// Versioned API • Role Locked • Crash Safe

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* =========================
   CONFIG
========================= */
const BACKEND_URL = "https://ff-india-tournaments.onrender.com/api/v1";
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

const adminName = document.getElementById("adminName");
const adminEmail = document.getElementById("adminEmail");
const adminList = document.getElementById("adminList");

const slotTournament = document.getElementById("slotTournament");
const slotPrize = document.getElementById("slotPrize");
const slotStage = document.getElementById("slotStage");
const slotDetails = document.getElementById("slotDetails");
const contactInput = document.getElementById("contactNumber");
const dmNumber = document.getElementById("dmNumber");

const postSlotBtn = document.getElementById("postSlot");
const addAdminBtn = document.getElementById("addAdmin");

const hotSlotList = document.getElementById("hotSlotList");
const hotSlotEmpty = document.getElementById("hotSlotEmpty");

const totalUsers = document.getElementById("totalUsers");
const activeTournaments = document.getElementById("activeTournaments");
const totalAdmins = document.getElementById("totalAdmins");

/* =========================
   SIDEBAR
========================= */
avatar?.addEventListener("click", () => {
  sidebar.classList.remove("hidden");
  overlay.classList.remove("hidden");
});

overlay?.addEventListener("click", () => {
  sidebar.classList.add("hidden");
  overlay.classList.add("hidden");
});

/* =========================
   LOGOUT
========================= */
logoutBtn?.addEventListener("click", async () => {
  if (!confirm("Logout from Creator Panel?")) return;
  await signOut(auth);
  location.href = "index.html";
});

/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, async user => {
  if (!user) return (location.href = "index.html");

  try {
    sessionToken = await getIdToken(user, true);

    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });

    const data = await res.json();
    if (data.role !== "creator") throw new Error("Unauthorized");

    creatorName.textContent = user.displayName || "Creator";
    creatorEmail.textContent = user.email || "";

    init();
  } catch (err) {
    console.error("Creator auth failed", err);
    await signOut(auth);
    location.href = "index.html";
  }
});

/* =========================
   SAFE API WRAPPER
========================= */
async function api(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`
    }
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server returned invalid response");
  }

  if (!res.ok) {
    throw new Error(data.msg || "API Error");
  }

  return data;
}

/* =========================
   INIT
========================= */
function init() {
  fetchStats();
  fetchAdmins();
  fetchMyHotSlots();
}

/* =========================
   HOT SLOT UI
========================= */
contactInput.oninput = () => {
  dmNumber.textContent = contactInput.value || "Not Set";
};

/* =========================
   POST HOT SLOT
========================= */
postSlotBtn.onclick = async () => {
  const payload = {
    tournamentName: slotTournament.value.trim(),
    prizePool: slotPrize.value.trim(),
    stage: slotStage.value.trim(),
    description: slotDetails.value.trim(),
    contact: contactInput.value.trim()
  };

  if (!payload.tournamentName || payload.contact.length !== 10) {
    return alert("Fill all fields correctly");
  }

  await api("/creator/hot-slot", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  slotTournament.value =
    slotPrize.value =
    slotStage.value =
    slotDetails.value =
      "";
  contactInput.value = "";
  dmNumber.textContent = "Not Set";

  fetchMyHotSlots();
};

/* =========================
   CREATE ADMIN
========================= */
addAdminBtn.onclick = async () => {
  if (!adminName.value || !adminEmail.value) {
    return alert("Enter admin details");
  }

  await api("/creator/create-admin", {
    method: "POST",
    body: JSON.stringify({
      name: adminName.value.trim(),
      email: adminEmail.value.trim()
    })
  });

  adminName.value = adminEmail.value = "";
  fetchAdmins();
};

/* =========================
   FETCH ADMINS
========================= */
async function fetchAdmins() {
  const data = await api("/creator/stats");
  adminList.innerHTML = "";

  data.admins.forEach(a => {
    const li = document.createElement("li");
    li.textContent = `${a.email} ❌`;
    li.onclick = async () => {
      if (!confirm(`Remove ${a.email}?`)) return;
      await api(`/creator/remove-admin/${a.email}`, { method: "DELETE" });
      fetchAdmins();
    };
    adminList.appendChild(li);
  });
}

/* =========================
   FETCH HOT SLOTS
========================= */
async function fetchMyHotSlots() {
  const data = await api("/creator/hot-slots");
  hotSlotList.innerHTML = "";

  if (!data.slots.length) {
    hotSlotEmpty.classList.remove("hidden");
    return;
  }

  hotSlotEmpty.classList.add("hidden");

  data.slots.forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${s.tournamentName}</strong><br>
      Stage: ${s.stage}<br>
      Prize: ${s.prizePool}<br>
      ${s.expired ? "⛔ Expired" : "✅ Active"}
    `;
    hotSlotList.appendChild(li);
  });
}

/* =========================
   FETCH STATS
========================= */
async function fetchStats() {
  const data = await api("/creator/stats");
  totalUsers.textContent = data.totalUsers || 0;
  activeTournaments.textContent = data.activeHotSlots || 0;
  totalAdmins.textContent = data.admins.length || 0;
}
