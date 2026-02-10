// js/admin.js
// FF INDIA TOURNAMENTS – ADMIN PANEL MASTER CONTROLLER
// Covers Phase 1 → Phase 12 (Fully Wired)

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ================= CONFIG ================= */
const BACKEND_URL = "https://ff-india-tournaments.onrender.com";
let sessionToken = null;

/* ================= GLOBAL DOM ================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logout");
const navItems = document.querySelectorAll(".side-item[data-section]");
const allSections = document.querySelectorAll("main section");

/* Dashboard Buttons */
const btnCreate = document.getElementById("btnCreate");
const btnManage = document.getElementById("btnManage");
const btnStaff = document.getElementById("btnStaff");
const btnTickets = document.getElementById("btnTickets");

/* ================= UI HELPERS ================= */
function showSection(id) {
  allSections.forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id)?.classList.remove("hidden");
  sidebar.classList.remove("active");
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
    const id = item.dataset.section;
    showSection(id);

    if (id === "manageSection") fetchTournaments();
    if (id === "lobbySection") fetchLobbies();
    if (id === "scheduleSection") fetchSchedules();
    if (id === "reminderSection") fetchReminders();
    if (id === "resultSection") fetchResults();
    if (id === "qualificationSection") fetchQualifications();
    if (id === "staffSection") fetchStaff();
    if (id === "ticketsSection") fetchTickets();
    if (id === "walletSection") fetchWallet();
    if (id === "profileSection") fetchAdminProfile();
  });
});

/* ================= AUTH GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.replace("index.html");

  try {
    sessionToken = await getIdToken(user, true);
    const role = await verifyAdmin(sessionToken);
    if (role !== "admin") throw new Error("Not admin");

    initDashboard();
  } catch (err) {
    console.error(err);
    await signOut(auth);
    window.location.replace("index.html");
  }
});

async function verifyAdmin(token) {
  const res = await fetch(`${BACKEND_URL}/auth/role`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Role check failed");
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

/* ================= INIT DASHBOARD ================= */
function initDashboard() {
  showSection("dashboardHome");

  btnCreate.onclick = () => showSection("createSection");
  btnManage.onclick = () => { showSection("manageSection"); fetchTournaments(); };
  btnStaff.onclick = () => { showSection("staffSection"); fetchStaff(); };
  btnTickets.onclick = () => { showSection("ticketsSection"); fetchTickets(); };

  setupCreateTournament();
}

/* =========================================================
   PHASE 2 – ADMIN WALLET
========================================================= */
async function fetchWallet() {
  const box = document.getElementById("walletBox");
  showLoading(box);
  try {
    const data = await api("/admin/wallet");
    box.innerHTML = `<h3>Balance: ₹${data.balance}</h3>`;
  } catch {
    box.innerHTML = "Wallet load failed";
  }
}

/* =========================================================
   PHASE 3 – CREATE TOURNAMENT
========================================================= */
function setupCreateTournament() {
  const form = document.getElementById("createForm");
  const entryType = document.getElementById("entryType");
  const paidBox = document.getElementById("paidBox");

  entryType?.addEventListener("change", () => {
    paidBox.classList.toggle("hidden", entryType.value !== "paid");
  });

  form?.addEventListener("submit", async e => {
    e.preventDefault();

    const body = {
      name: tournamentName.value.trim(),
      slots: Number(slots.value),
      prizePool: prizePool.value.trim(),
      entryType: entryType.value,
      entryFee: entryType.value === "paid" ? Number(entryFee.value) : 0,
      upiId: entryType.value === "paid" ? upiId.value.trim() : undefined
    };

    await api("/tournaments/create", { method: "POST", body: JSON.stringify(body) });
    alert("Tournament Created ✅");
    form.reset();
    paidBox.classList.add("hidden");
  });
}

/* =========================================================
   PHASE 4 – MANAGE TOURNAMENTS
========================================================= */
async function fetchTournaments() {
  const list = document.getElementById("tournamentList");
  showLoading(list);
  const data = await api("/tournaments/admin/upcoming");
  list.innerHTML = data.tournaments.map(t =>
    `<div class="card"><h4>${t.name}</h4><p>Slots: ${t.slots}</p></div>`
  ).join("");
}

/* =========================================================
   PHASE 5 – LOBBY MANAGEMENT
========================================================= */
async function fetchLobbies() {
  const box = document.getElementById("lobbyList");
  showLoading(box);
  const data = await api("/lobbies/admin");
  box.innerHTML = data.lobbies.map(l =>
    `<div class="card"><p>${l.tournament}</p><p>Room ID: ${l.roomId}</p></div>`
  ).join("");
}

/* =========================================================
   PHASE 6 – SCHEDULE SYSTEM
========================================================= */
async function fetchSchedules() {
  const box = document.getElementById("scheduleList");
  showLoading(box);
  const data = await api("/schedule/admin");
  box.innerHTML = data.schedules.map(s =>
    `<div class="card"><p>${s.match}</p><p>${s.time}</p></div>`
  ).join("");
}

/* =========================================================
   PHASE 7 – REMINDER SYSTEM
========================================================= */
async function fetchReminders() {
  const box = document.getElementById("reminderList");
  showLoading(box);
  const data = await api("/reminders/admin");
  box.innerHTML = data.reminders.map(r =>
    `<div class="card"><p>${r.title}</p><p>${r.time}</p></div>`
  ).join("");
}

/* =========================================================
   PHASE 8 – RESULT UPLOAD
========================================================= */
async function fetchResults() {
  const box = document.getElementById("resultList");
  showLoading(box);
  const data = await api("/results/admin");
  box.innerHTML = data.results.map(r =>
    `<div class="card"><p>${r.match}</p><p>Winner: ${r.winner}</p></div>`
  ).join("");
}

/* =========================================================
   PHASE 9 – NEXT STAGE QUALIFICATION
========================================================= */
async function fetchQualifications() {
  const box = document.getElementById("qualificationList");
  showLoading(box);
  const data = await api("/qualification/admin");
  box.innerHTML = data.players.map(p =>
    `<div class="card"><p>${p.name}</p><p>Status: ${p.status}</p></div>`
  ).join("");
}

/* =========================================================
   PHASE 10 – STAFF MANAGEMENT
========================================================= */
async function fetchStaff() {
  const box = document.getElementById("staffList");
  showLoading(box);
  const data = await api("/staff/list");
  box.innerHTML = data.staff.map(s =>
    `<div class="card"><p>${s.name}</p><p>${s.role}</p></div>`
  ).join("");
}

/* =========================================================
   PHASE 11 – SUPPORT TICKETS
========================================================= */
async function fetchTickets() {
  const box = document.getElementById("ticketList");
  showLoading(box);
  const data = await api("/support/admin/tickets");
  box.innerHTML = data.tickets.map(t =>
    `<div class="card"><p>${t.user}</p><p>${t.message}</p></div>`
  ).join("");
}

/* =========================================================
   PHASE 12 – ADMIN PROFILE
========================================================= */
async function fetchAdminProfile() {
  const box = document.getElementById("adminProfileBox");
  showLoading(box);
  const data = await api("/admin/profile");
  box.innerHTML = `
    <h3>${data.name}</h3>
    <p>Email: ${data.email}</p>
    <p>Org: ${data.orgName || "N/A"}</p>
  `;
        }
