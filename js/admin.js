// js/admin.js

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
   AUTH GUARD + BACKEND ROLE CHECK
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  console.log("Logged in:", user.email);

  try {
    const token = await getIdToken(user, true); // Firebase ID token
    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Role verification failed");

    const data = await res.json();

    if (data.role !== "admin") {
      alert("Access denied! You are not an admin.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    console.log("Role verified:", data.role);

  } catch (err) {
    console.error(err);
    alert("Authentication failed, redirecting...");
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
   SIDEBAR TOGGLE
========================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");

avatar.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

/* =========================
   NOTIFICATIONS
========================= */
const bell = document.getElementById("bell");
const panel = document.getElementById("notificationPanel");

bell.addEventListener("click", () => {
  panel.classList.toggle("active");
});

/* =========================
   LOGOUT
========================= */
const logoutBtn = document.getElementById("logout");

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
    alert("Logout failed");
  }
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
   ENTRY FEE CONDITION
========================= */
const entryType = document.getElementById("entryType");
const entryFee = document.getElementById("entryFee");

entryType.addEventListener("change", () => {
  if (entryType.value === "paid") {
    entryFee.classList.remove("hidden");
  } else {
    entryFee.classList.add("hidden");
  }
});

/* =========================
   CREATE TOURNAMENT (BACKEND)
========================= */
const submitBtn = createForm.querySelector(".submit");

submitBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("User not logged in");

  const token = await getIdToken(user);

  const body = {
    name: document.getElementById("tournamentName").value,
    slots: parseInt(document.getElementById("slots").value),
    prizePool: document.getElementById("prizePool").value,
    entryType: document.getElementById("entryType").value,
    entryFee: parseInt(document.getElementById("entryFee").value) || 0,
    status: "upcoming"
  };

  try {
    const res = await fetch(`${BACKEND_URL}/tournaments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (res.ok) {
      alert("Tournament created successfully!");
      createForm.reset();
    } else {
      alert("Error: " + (data.msg || data.message));
    }

  } catch (err) {
    console.error("Create tournament error:", err);
    alert("Failed to create tournament. Check console.");
  }
});

/* =========================
   FETCH TOURNAMENTS (MANAGE)
========================= */
async function fetchTournaments() {
  const user = auth.currentUser;
  if (!user) return;

  const token = await getIdToken(user);

  try {
    const res = await fetch(`${BACKEND_URL}/tournaments/upcoming`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const tournaments = await res.json();

    const listDiv = document.getElementById("tournamentList");
    if (!tournaments || tournaments.length === 0) {
      listDiv.innerHTML = "<p>No tournaments found</p>";
      return;
    }

    listDiv.innerHTML = tournaments.map(t => `
      <div class="tournament-card">
        <h4>${t.name}</h4>
        <p>Slots: ${t.slots} | Prize: ${t.prizePool}</p>
        <p>Entry: ${t.entryType} ${t.entryFee ? "- ₹" + t.entryFee : ""}</p>
        <p>Status: ${t.status}</p>
      </div>
    `).join("");

  } catch (err) {
    console.error("Fetch tournaments error:", err);
  }
}
