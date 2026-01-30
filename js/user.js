// js/user.js (FIXED + STABLE)

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
    location.href = "index.html";
    return;
  }

  try {
    const token = await getIdToken(user);
    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (data.role !== "user") {
      await signOut(auth);
      location.href = "index.html";
      return;
    }

    fetchTournaments();
    fetchHotSlots();

  } catch (err) {
    await signOut(auth);
    location.href = "index.html";
  }
});

/* =========================
SIDEBAR TOGGLE
========================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");

avatar.onclick = () => {
  sidebar.classList.toggle("active");
};

/* =========================
SIDEBAR TAB FIX 🔥
========================= */
document.querySelectorAll(".sidebar-section").forEach(item => {
  item.addEventListener("click", () => {
    const tab = item.dataset.tab;
    if (!tab) return;

    activateTab(tab);
    sidebar.classList.remove("active");
  });
});

/* =========================
LOGOUT
========================= */
document.getElementById("logout").onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};

/* =========================
TOP TABS
========================= */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.onclick = () => activateTab(btn.dataset.tab);
});

function activateTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add("active");
  document.getElementById(tabId)?.classList.add("active");

  // 🔔 Hot slot seen
  if (tabId === "hot") {
    localStorage.setItem("lastHotSeen", Date.now());
    document.getElementById("hotBadge").style.display = "none";
  }
}

/* =========================
FETCH TOURNAMENTS
========================= */
async function fetchTournaments() {
  const types = ["ongoing", "upcoming", "past"];

  for (let type of types) {
    const res = await fetch(`${BACKEND_URL}/tournaments/public/${type}`);
    const data = await res.json();

    document.getElementById(type).innerHTML =
      data.length === 0
        ? "No tournaments"
        : data.map(t => `
          <div class="card">
            <h4>${t.name}</h4>
            <p>Prize: ${t.prizePool}</p>
            <p>Slots: ${t.slots}</p>
          </div>
        `).join("");
  }
}

/* =========================
HOT SLOTS + BADGE LOGIC ✅
========================= */
async function fetchHotSlots() {
  const res = await fetch(`${BACKEND_URL}/hot-slots`);
  const slots = await res.json();

  const hotDiv = document.getElementById("hot");
  const badge = document.getElementById("hotBadge");

  hotDiv.innerHTML = slots.map(s => `
    <div class="card hot-slot">
      <h4>${s.tournament}</h4>
      <p>Prize: ${s.prizePool}</p>
      <p>Stage: ${s.stage}</p>
      <a href="https://wa.me/91${s.contact}" target="_blank">Contact</a>
    </div>
  `).join("");

  const lastSeen = Number(localStorage.getItem("lastHotSeen") || 0);
  const newCount = slots.filter(
    s => new Date(s.createdAt).getTime() > lastSeen
  ).length;

  if (newCount > 0) {
    badge.innerText = newCount;
    badge.style.display = "inline-block";
  }
    }
