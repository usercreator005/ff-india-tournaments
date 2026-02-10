// js/admin.js
// ADMIN PANEL – FULL 12 PHASE CONTROLLER
// Auth Guard • Role Check • Section Router • Central API

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ================= CONFIG ================= */
const BACKEND_URL = "https://ff-india-tournaments.onrender.com";
let sessionToken = null;

/* ================= DOM ================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logout");

// Sidebar navigation items
const navItems = document.querySelectorAll(".side-item[data-section]");

// Dashboard quick buttons
const btnCreate = document.getElementById("btnCreate");
const btnManage = document.getElementById("btnManage");
const btnStaff = document.getElementById("btnStaff");
const btnTickets = document.getElementById("btnTickets");

// Sections
const allSections = document.querySelectorAll("main section");

// Create Tournament عناصر
const createForm = document.getElementById("createForm");
const entryType = document.getElementById("entryType");
const paidBox = document.getElementById("paidBox");

// Manage Tournament
const tournamentList = document.getElementById("tournamentList");

/* ================= UI HELPERS ================= */
function showSectionById(id) {
  allSections.forEach(sec => sec.classList.add("hidden"));
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");
  sidebar.classList.remove("active");
}

function showLoading(el, msg = "Loading...") {
  if (el) el.innerHTML = `<p>${msg}</p>`;
}

/* ================= SIDEBAR ================= */
avatar?.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.replace("index.html");
});

navItems.forEach(item => {
  item.addEventListener("click", () => {
    const sectionId = item.dataset.section;
    showSectionById(sectionId);

    // Auto-load data for certain sections
    if (sectionId === "manageSection") fetchTournaments();
  });
});

/* ================= AUTH GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("index.html");
    return;
  }

  try {
    sessionToken = await getIdToken(user, true);
    const role = await verifyAdmin(sessionToken);
    if (role !== "admin") throw new Error("Not admin");

    initAdminPanel();

  } catch (err) {
    console.error("Access denied:", err);
    await signOut(auth);
    window.location.replace("index.html");
  }
});

/* ================= ROLE VERIFY ================= */
async function verifyAdmin(token) {
  const res = await fetch(`${BACKEND_URL}/auth/role`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Role check failed");
  const data = await res.json();
  return data.role;
}

/* ================= API HELPER ================= */
async function api(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
      ...(options.headers || {})
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "API error");
  return data;
}

/* ================= INIT PANEL ================= */
function initAdminPanel() {
  // Default Home
  showSectionById("dashboardHome");

  // Dashboard Quick Buttons
  btnCreate.onclick = () => showSectionById("createSection");
  btnManage.onclick = () => {
    showSectionById("manageSection");
    fetchTournaments();
  };
  btnStaff.onclick = () => showSectionById("staffSection");
  btnTickets.onclick = () => showSectionById("ticketsSection");

  // Entry Type Toggle
  entryType?.addEventListener("change", () => {
    paidBox.classList.toggle("hidden", entryType.value !== "paid");
  });
}

/* ================= PHASE 3 – CREATE TOURNAMENT ================= */
createForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    name: tournamentName.value.trim(),
    slots: Number(slots.value),
    prizePool: prizePool.value.trim(),
    entryType: entryType.value,
    entryFee: entryType.value === "paid" ? Number(entryFee.value) : 0,
    upiId: entryType.value === "paid" ? upiId.value.trim() : undefined
  };

  if (!body.name || !body.slots || !body.prizePool) {
    return alert("Fill all required fields");
  }

  if (body.entryType === "paid" && (!body.entryFee || !body.upiId)) {
    return alert("Paid tournament needs fee & UPI");
  }

  try {
    await api("/tournaments/create", {
      method: "POST",
      body: JSON.stringify(body)
    });

    alert("Tournament created ✅");
    createForm.reset();
    paidBox.classList.add("hidden");

  } catch (err) {
    alert(err.message);
  }
});

/* ================= PHASE 4 – FETCH TOURNAMENTS ================= */
async function fetchTournaments() {
  showLoading(tournamentList);

  try {
    const data = await api("/tournaments/admin/upcoming");
    const tournaments = data.tournaments || [];

    if (!tournaments.length) {
      tournamentList.innerHTML = "<p>No tournaments found</p>";
      return;
    }

    tournamentList.innerHTML = tournaments.map(t => `
      <div class="tournament-card">
        <h4>${t.name}</h4>
        <p>Slots: ${t.slots}</p>
        <p>Entry: ${t.entryType}</p>
        <p>Fee: ${t.entryFee ? "₹" + t.entryFee : "Free"}</p>
        <p>UPI: ${t.upiId || "-"}</p>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    tournamentList.innerHTML = "<p>Error loading tournaments</p>";
  }
}
