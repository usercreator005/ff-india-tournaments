// js/creator.js
// CREATOR DASHBOARD – FINAL PRODUCTION BUILD
// No Dummy UI • Role Locked • Pre-Launch Safe

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
function openSidebar() {
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
  if (!user) return location.href = "index.html";

  try {
    sessionToken = await getIdToken(user, true);
    const role = await verifyRole(sessionToken);
    if (role !== "creator") throw new Error("Unauthorized");

    creatorName.textContent = user.displayName || "Creator";
    creatorEmail.textContent = user.email || "";

    init();
  } catch {
    await signOut(auth);
    location.href = "index.html";
  }
});

async function verifyRole(token) {
  const res = await fetch(`${BACKEND_URL}/auth/role`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error();
  return data.role;
}

/* =========================
   API
========================= */
async function api(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "API Error");
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
  postSlotBtn.disabled = true;

  const payload = {
    tournamentName: slotTournament.value.trim(),
    prizePool: slotPrize.value.trim(),
    stage: slotStage.value.trim(),
    description: slotDetails.value.trim(),
    contact: contactInput.value.trim()
  };

  if (!payload.tournamentName || !payload.stage || payload.contact.length !== 10) {
    alert("Fill all fields correctly");
    postSlotBtn.disabled = false;
    return;
  }

  try {
    await api("/creator/hot-slot", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    slotTournament.value = slotPrize.value =
    slotStage.value = slotDetails.value = "";
    contactInput.value = "";
    dmNumber.textContent = "Not Set";

    fetchMyHotSlots();
  } catch (e) {
    alert(e.message);
  }

  postSlotBtn.disabled = false;
};

/* =========================
   CREATE ADMIN
========================= */
addAdminBtn.onclick = async () => {
  addAdminBtn.disabled = true;

  if (!adminName.value || !adminEmail.value) {
    alert("Enter admin details");
    addAdminBtn.disabled = false;
    return;
  }

  try {
    await api("/creator/create-admin", {
      method: "POST",
      body: JSON.stringify({
        name: adminName.value.trim(),
        email: adminEmail.value.trim()
      })
    });

    adminName.value = adminEmail.value = "";
    fetchAdmins();
  } catch (e) {
    alert(e.message);
  }

  addAdminBtn.disabled = false;
};

/* =========================
   FETCH ADMINS
========================= */
async function fetchAdmins() {
  const data = await api("/creator/stats");
  adminList.innerHTML = "";
  (data.admins || []).forEach(a => {
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

  if (!data.slots?.length) {
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
  totalAdmins.textContent = data.admins?.length || 0;
}
