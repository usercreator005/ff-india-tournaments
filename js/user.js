// js/user.js (FINAL – SIDEBAR + NOTIFICATION 100% WORKING)

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
SIDEBAR / NOTIFICATION TOGGLE ✅
========================= */
avatar.addEventListener("click", (e) => {
  e.stopPropagation();
  sidebar.classList.toggle("active");
  panel.classList.remove("active");
});

bell.addEventListener("click", (e) => {
  e.stopPropagation();
  panel.classList.toggle("active");
  sidebar.classList.remove("active");
});

sidebar.addEventListener("click", e => e.stopPropagation());
panel.addEventListener("click", e => e.stopPropagation());

document.addEventListener("click", () => {
  sidebar.classList.remove("active");
  panel.classList.remove("active");
});

/* =========================
TAB UTILITY
========================= */
function openTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.tab === tabName)
  );

  document.querySelectorAll(".tab").forEach(t =>
    t.classList.toggle("active", t.id === tabName)
  );

  sidebar.classList.remove("active");
}

/* =========================
SIDEBAR SECTIONS
========================= */
document.getElementById("userInfoBtn").onclick = () => {
  document.getElementById("ongoing").innerHTML = `
    <div class="card">
      <h4>User Information</h4>
      <p>Email: ${window.currentUser.email}</p>
      <p>User ID: ${window.currentUser.uid}</p>
    </div>
  `;
  openTab("ongoing");
};

document.getElementById("teamBtn").onclick = () => {
  document.getElementById("upcoming").innerHTML = `
    <div class="card">
      <h4>Team</h4>
      <p>Team feature coming soon.</p>
    </div>
  `;
  openTab("upcoming");
};

document.getElementById("myTournamentsBtn").onclick = () => {
  openTab("upcoming");
};

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
FETCH TOURNAMENTS (SAFE)
========================= */
async function fetchTournaments() {
  try {
    const [o, u, p] = await Promise.all([
      fetch(`${BACKEND_URL}/tournaments/public/ongoing`).then(r => r.json()),
      fetch(`${BACKEND_URL}/tournaments/public/upcoming`).then(r => r.json()),
      fetch(`${BACKEND_URL}/tournaments/public/past`).then(r => r.json())
    ]);

    renderTournaments("ongoing", normalize(o));
    renderTournaments("upcoming", normalize(u));
    renderTournaments("past", normalize(p));
  } catch (e) {
    console.error("Tournament fetch error:", e);
  }
}

const normalize = d =>
  Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];

function renderTournaments(id, list) {
  const div = document.getElementById(id);
  div.innerHTML = list.length
    ? list.map(t => `
        <div class="card">
          <h4>${t.name}</h4>
          <p>Slots: ${t.slots}</p>
          <p>Prize: ₹${t.prizePool}</p>
        </div>
      `).join("")
    : "<p>No tournaments found</p>";
}

/* =========================
HOT SLOTS
========================= */
async function fetchHotSlots() {
  try {
    const res = await fetch(`${BACKEND_URL}/hot-slots`);
    const slots = Array.isArray(await res.json()) ? await res.json() : [];

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

  } catch (e) {
    console.error("Hot slot error:", e);
  }
}

function clearHotBadge() {
  document.getElementById("hotBadge").style.display = "none";
  fetch(`${BACKEND_URL}/hot-slots`)
    .then(r => r.json())
    .then(d => localStorage.setItem("hotSlotCount", Array.isArray(d) ? d.length : 0));
                          }
