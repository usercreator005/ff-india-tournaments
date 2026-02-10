// ADMIN PANEL – COMPLETE PHASE CONTROLLER (PHASE 1–11)
// Auth Guard • Role Check • Section Router • Central API Layer

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

const navItems = document.querySelectorAll(".side-item[data-section]");
const allSections = document.querySelectorAll("main section");

const btnCreate = document.getElementById("btnCreate");
const btnManage = document.getElementById("btnManage");
const btnStaff = document.getElementById("btnStaff");
const btnTickets = document.getElementById("btnTickets");

const createForm = document.getElementById("createForm");
const entryType = document.getElementById("entryType");
const paidBox = document.getElementById("paidBox");

const tournamentList = document.getElementById("tournamentList");

/* ================= UI HELPERS ================= */
function showSectionById(id) {
  allSections.forEach(sec => sec.classList.add("hidden"));
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");
  sidebar.classList.remove("active");

  // Auto loaders by phase
  if (id === "manageSection") fetchTournaments();
  if (id === "adminInfoSection") loadAdminInfo();
  if (id === "walletSection") loadWallet();
  if (id === "staffSection") loadStaff();
  if (id === "ticketsSection") loadTickets();
  if (id === "historySection") loadHistory();
}

function showLoading(el, msg = "Loading...") {
  if (el) el.innerHTML = `<p>${msg}</p>`;
}

/* ================= SIDEBAR ================= */
avatar?.addEventListener("click", () => sidebar.classList.toggle("active"));
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.replace("index.html");
});

navItems.forEach(item => {
  item.addEventListener("click", () => {
    showSectionById(item.dataset.section);
  });
});

/* ================= AUTH GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.replace("index.html");

  try {
    sessionToken = await getIdToken(user, true);
    const role = await verifyAdmin(sessionToken);
    if (role !== "admin") throw new Error();

    initAdminPanel();
  } catch {
    await signOut(auth);
    window.location.replace("index.html");
  }
});

/* ================= ROLE VERIFY ================= */
async function verifyAdmin(token) {
  const res = await fetch(`${BACKEND_URL}/auth/role`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error();
  return (await res.json()).role;
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

/* ================= INIT ================= */
function initAdminPanel() {
  showSectionById("dashboardHome");

  btnCreate.onclick = () => showSectionById("createSection");
  btnManage.onclick = () => showSectionById("manageSection");
  btnStaff.onclick = () => showSectionById("staffSection");
  btnTickets.onclick = () => showSectionById("ticketsSection");

  entryType?.addEventListener("change", () => {
    paidBox.classList.toggle("hidden", entryType.value !== "paid");
  });
}

/* =========================================================
   PHASE 3 – CREATE TOURNAMENT
========================================================= */
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

  try {
    await api("/tournaments/create", { method: "POST", body: JSON.stringify(body) });
    alert("Tournament created ✅");
    createForm.reset();
    paidBox.classList.add("hidden");
  } catch (err) {
    alert(err.message);
  }
});

/* =========================================================
   PHASE 4 – MANAGE TOURNAMENTS
========================================================= */
async function fetchTournaments() {
  showLoading(tournamentList);
  try {
    const data = await api("/tournaments/admin/upcoming");
    const tournaments = data.tournaments || [];
    tournamentList.innerHTML = tournaments.length
      ? tournaments.map(t => `
        <div class="tournament-card">
          <h4>${t.name}</h4>
          <p>Slots: ${t.slots}</p>
          <p>Entry: ${t.entryType}</p>
        </div>`).join("")
      : "<p>No tournaments found</p>";
  } catch {
    tournamentList.innerHTML = "<p>Error loading tournaments</p>";
  }
}

/* =========================================================
   PHASE 1 – ADMIN INFO DASHBOARD
========================================================= */
async function loadAdminInfo() {
  const box = document.getElementById("adminStats");
  showLoading(box);
  try {
    const data = await api("/admin/dashboard");
    box.innerHTML = `
      <p><b>Name:</b> ${data.name}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Total Tournaments:</b> ${data.totalTournaments}</p>
      <p><b>Live:</b> ${data.live}</p>
      <p><b>Upcoming:</b> ${data.upcoming}</p>
      <p><b>Past:</b> ${data.past}</p>
      <p><b>Total Prize Pool:</b> ₹${data.totalPrizePool}</p>
      <p><b>Total Staff:</b> ${data.staffCount}</p>
    `;
  } catch {
    box.innerHTML = "Failed to load admin data";
  }
}

/* =========================================================
   PHASE 2 – WALLET
========================================================= */
async function loadWallet() {
  const box = document.getElementById("walletData");
  showLoading(box);
  try {
    const data = await api("/wallet/admin");
    box.innerHTML = `<p><b>Balance:</b> ₹${data.balance}</p>`;
  } catch {
    box.innerHTML = "Failed to load wallet";
  }
}

/* =========================================================
   PHASE 10 – STAFF MANAGEMENT
========================================================= */
async function loadStaff() {
  const box = document.getElementById("staffPanel");
  showLoading(box);
  try {
    const data = await api("/staff/list");
    box.innerHTML = data.staff.map(s => `<div class="staff-card">${s.name} - ${s.role}</div>`).join("");
  } catch {
    box.innerHTML = "Failed to load staff";
  }
}

/* =========================================================
   PHASE 11 – SUPPORT TICKETS
========================================================= */
async function loadTickets() {
  const box = document.getElementById("ticketsPanel");
  showLoading(box);
  try {
    const data = await api("/support/admin");
    box.innerHTML = data.tickets.map(t => `<div class="ticket-card">${t.subject}</div>`).join("");
  } catch {
    box.innerHTML = "Failed to load tickets";
  }
}

/* =========================================================
   TOURNAMENT HISTORY
========================================================= */
async function loadHistory() {
  const box = document.getElementById("historyList");
  showLoading(box);
  try {
    const data = await api("/tournaments/admin/history");
    box.innerHTML = data.history.map(h => `<div class="tournament-card">${h.name}</div>`).join("");
  } catch {
    box.innerHTML = "Failed to load history";
  }
  }
