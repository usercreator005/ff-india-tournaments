// js/admin.js

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const token = await getIdToken(user, true);

    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (data.role !== "admin") {
      alert("Access denied!");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    console.log("Admin verified:", user.email);
  } catch (err) {
    console.error("Auth error:", err);
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
   UI CONTROLS
========================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logout");

avatar.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

/* =========================
   TOGGLE CREATE / MANAGE
========================= */
const btnCreate = document.getElementById("btnCreate");
const btnManage = document.getElementById("btnManage");
const createForm = document.getElementById("createForm");
const manageSection = document.getElementById("manageSection");

btnCreate.addEventListener("click", () => {
  createForm.classList.remove("hidden");
  manageSection.classList.add("hidden");
});

btnManage.addEventListener("click", () => {
  manageSection.classList.remove("hidden");
  createForm.classList.add("hidden");
  fetchTournaments();
});

/* =========================
   ENTRY FEE TOGGLE
========================= */
const entryType = document.getElementById("entryType");
const entryFee = document.getElementById("entryFee");

entryType.addEventListener("change", () => {
  entryFee.classList.toggle("hidden", entryType.value !== "paid");
});

/* =========================
   CREATE TOURNAMENT
========================= */
createForm.querySelector(".submit").addEventListener("click", async () => {
  const user = auth.currentUser;
  const token = await getIdToken(user);

  const body = {
    name: document.getElementById("tournamentName").value,
    slots: Number(document.getElementById("slots").value),
    prizePool: document.getElementById("prizePool").value,
    entryType: entryType.value,
    entryFee: Number(entryFee.value) || 0
  };

  const res = await fetch(`${BACKEND_URL}/tournaments/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (res.ok) {
    alert("Tournament created");
    createForm.reset();
  } else {
    alert(data.msg || "Error");
  }
});

/* =========================
   FETCH TOURNAMENTS (ADMIN)
========================= */
async function fetchTournaments() {
  const token = await getIdToken(auth.currentUser);

  const res = await fetch(`${BACKEND_URL}/tournaments/admin/upcoming`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const tournaments = await res.json();
  const list = document.getElementById("tournamentList");

  if (!tournaments.length) {
    list.innerHTML = "<p>No tournaments found</p>";
    return;
  }

  list.innerHTML = tournaments.map(t => `
    <div class="tournament-card">
      <h4>${t.name}</h4>
      <p>Slots: ${t.slots}</p>
      <p>Prize: ${t.prizePool}</p>
      <p>Entry: ${t.entryType} ${t.entryFee ? "₹" + t.entryFee : ""}</p>
      <p>Status: ${t.status}</p>
    </div>
  `).join("");
}
