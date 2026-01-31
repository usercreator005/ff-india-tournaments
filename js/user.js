// js/user.js (FIXED + STABLE)

// Firebase Auth
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
    const token = await getIdToken(user);

    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (data.role !== "user") throw new Error("Not user");

    window.currentUser = user;

    fetchTournaments();
    fetchHotSlots();

  } catch (err) {
    console.error("Auth error:", err);
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
ELEMENTS
========================= */
const sidebar = document.getElementById("sidebar");
const avatar = document.getElementById("avatar");
const bell = document.getElementById("notificationBell");
const panel = document.getElementById("notificationPanel");

/* =========================
SIDEBAR / PANEL TOGGLE
========================= */
avatar.onclick = () => {
  sidebar.classList.toggle("active");
  panel.classList.remove("active");
};

bell.onclick = () => {
  panel.classList.toggle("active");
  sidebar.classList.remove("active");
};

document.addEventListener("click", () => {
  sidebar.classList.remove("active");
  panel.classList.remove("active");
});

sidebar.onclick = e => e.stopPropagation();
panel.onclick = e => e.stopPropagation();

/* =========================
TAB UTILITY
========================= */
function openTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.id === tabName);
  });

  sidebar.classList.remove("active");
}

/* =========================
SIDEBAR SECTIONS
========================= */

// USER INFO
document.getElementById("userInfoBtn").onclick = () => {
  const div = document.getElementById("ongoing");

  div.innerHTML = `
    <div class="card">
      <h4>User Information</h4>
      <p>Email: ${window.currentUser.email}</p>
      <p>User ID: ${window.currentUser.uid}</p>
    </div>
  `;

  openTab("ongoing");
};

// TEAM
document.getElementById("teamBtn").onclick = () => {
  const div = document.getElementById("upcoming");

  div.innerHTML = `
    <div class="card">
      <h4>Team</h4>
      <p>Team feature coming soon.</p>
    </div>
  `;

  openTab("upcoming");
};

// MY TOURNAMENTS
document.getElementById("myTournamentsBtn").onclick = () => {
  openTab("upcoming");
};

// SUPPORT
document.getElementById("supportBtn").onclick = () => {
  window.open("https://wa.me/91XXXXXXXXXX", "_blank");
  sidebar.classList.remove("active");
};

/* =========================
LOGOUT
========================= */
document.getElementById("logout").onclick = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

/* =========================
TAB BUTTONS
========================= */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.onclick = () => {
    openTab(btn.dataset.tab);
    if (btn.dataset.tab === "hot") clearHotBadge();
  };
});

/* =========================
FETCH TOURNAMENTS (FIXED)
========================= */
async function fetchTournaments() {
  try {
    const [o, u, p] = await Promise.all([
      fetch(`${BACKEND_URL}/tournaments/public/ongoing`).then(r => r.json()),
      fetch(`${BACKEND_URL}/tournaments/public/upcoming`).then(r => r.json()),
      fetch(`${BACKEND_URL}/tournaments/public/past`).then(r => r.json())
    ]);

    renderTournaments("ongoing", normalizeArray(o));
    renderTournaments("upcoming", normalizeArray(u));
    renderTournaments("past", normalizeArray(p));

  } catch (err) {
    console.error("Tournament fetch error:", err);
  }
}

/* =========================
SAFE NORMALIZER 🔥
========================= */
function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.tournaments)) return data.tournaments;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

function renderTournaments(id, list) {
  const div = document.getElementById(id);

  if (!list.length) {
    div.innerHTML = "<p>No tournaments found</p>";
    return;
  }

  div.innerHTML = list.map(t => `
    <div class="card">
      <h4>${t.name}</h4>
      <p>Slots: ${t.slots}</p>
      <p>Prize: ₹${t.prizePool}</p>
    </div>
  `).join("");
}

/* =========================
HOT SLOTS (SAFE)
========================= */
async function fetchHotSlots() {
  try {
    const res = await fetch(`${BACKEND_URL}/hot-slots`);
    const raw = await res.json();
    const slots = Array.isArray(raw) ? raw : [];

    const div = document.getElementById("hot");
    const badge = document.getElementById("hotBadge");

    if (!slots.length) {
      div.innerHTML = "No hot slots";
      badge.style.display = "none";
      return;
    }

    const last = Number(localStorage.getItem("hotSlotCount") || 0);
    if (slots.length > last) {
      badge.innerText = slots.length - last;
      badge.style.display = "inline-block";
    }

    div.innerHTML = slots.map(s => `
      <div class="card hot-slot">
        <h4>${s.tournament}</h4>
        <p>Prize: ₹${s.prizePool}</p>
        <a href="https://wa.me/91${s.contact}" target="_blank">Contact</a>
      </div>
    `).join("");

  } catch (err) {
    console.error("Hot slot error:", err);
  }
}

function clearHotBadge() {
  document.getElementById("hotBadge").style.display = "none";
  fetch(`${BACKEND_URL}/hot-slots`)
    .then(r => r.json())
    .then(d => localStorage.setItem("hotSlotCount", Array.isArray(d) ? d.length : 0));
    }
