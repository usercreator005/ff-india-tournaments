// js/admin.js
// ADMIN PANEL – PHASE STRUCTURE READY
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

const btnCreate = document.getElementById("btnCreate");
const btnManage = document.getElementById("btnManage");

const createForm = document.getElementById("createForm");
const manageSection = document.getElementById("manageSection");

const entryType = document.getElementById("entryType");
const paidBox = document.getElementById("paidBox");
const tournamentList = document.getElementById("tournamentList");

/* ================= UI HELPERS ================= */
function showSection(section) {
  createForm.classList.add("hidden");
  manageSection.classList.add("hidden");

  section.classList.remove("hidden");
}

function showLoading(el, msg = "Loading...") {
  el.innerHTML = `<p>${msg}</p>`;
}

/* ================= SIDEBAR ================= */
avatar?.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.replace("index.html");
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

    if (role !== "admin") throw new Error("Not an admin");

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
  // Phase 3 – Create Tournament
  btnCreate.onclick = () => showSection(createForm);

  // Phase 4 – Manage Tournaments
  btnManage.onclick = () => {
    showSection(manageSection);
    fetchTournaments();
  };

  // Entry Type Toggle
  entryType.onchange = () => {
    paidBox.classList.toggle("hidden", entryType.value !== "paid");
  };
}

/* ================= CREATE TOURNAMENT ================= */
createForm.onsubmit = async (e) => {
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
};

/* ================= FETCH TOURNAMENTS ================= */
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
