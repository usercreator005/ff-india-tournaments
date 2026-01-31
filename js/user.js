// js/user.js (Backend Integrated - STABLE + UI FIXED)

// Firebase Auth (Modular)
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

  try {
    const token = await getIdToken(user);

    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Unauthorized");

    const data = await res.json();

    if (data.role !== "user") {
      alert("Access denied! You are not a user.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    console.log("User verified:", user.email);

    fetchTournaments();
    fetchHotSlots();

  } catch (err) {
    console.error("Auth error:", err);
    alert("Session expired. Please login again.");
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
ELEMENTS
========================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");
const bell = document.getElementById("notificationBell");
const panel = document.getElementById("notificationPanel");

/* =========================
SIDEBAR TOGGLE
========================= */
avatar.addEventListener("click", (e) => {
  e.stopPropagation();
  sidebar.classList.toggle("active");
  panel.classList.remove("active");
});

/* =========================
NOTIFICATION PANEL TOGGLE
========================= */
bell.addEventListener("click", (e) => {
  e.stopPropagation();
  panel.classList.toggle("active");
  sidebar.classList.remove("active");
});

/* =========================
CLOSE SIDEBAR / PANEL ON OUTSIDE CLICK
========================= */
document.addEventListener("click", () => {
  sidebar.classList.remove("active");
  panel.classList.remove("active");
});

sidebar.addEventListener("click", (e) => e.stopPropagation());
panel.addEventListener("click", (e) => e.stopPropagation());

/* =========================
SIDEBAR BUTTONS
========================= */
document.getElementById("userInfoBtn").onclick = () => {
  alert("User Info section coming soon");
  sidebar.classList.remove("active");
};

document.getElementById("teamBtn").onclick = () => {
  alert("Team feature coming soon");
  sidebar.classList.remove("active");
};

document.getElementById("myTournamentsBtn").onclick = () => {
  alert("My Tournaments section coming soon");
  sidebar.classList.remove("active");
};

document.getElementById("supportBtn").onclick = () => {
  window.open("https://wa.me/91XXXXXXXXXX", "_blank");
  sidebar.classList.remove("active");
};

/* =========================
LOGOUT
========================= */
document.getElementById("logout").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
    alert("Logout failed");
  }
});

/* =========================
TABS SWITCHING
========================= */
const tabBtns = document.querySelectorAll(".tab-btn");
const tabs = document.querySelectorAll(".tab");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    tabs.forEach(t => t.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");

    sidebar.classList.remove("active");

    if (btn.dataset.tab === "hot") {
      clearHotBadge();
    }
  });
});

/* =========================
FETCH TOURNAMENTS
========================= */
async function fetchTournaments() {
  try {
    const [ongoing, upcoming, past] = await Promise.all([
      fetch(`${BACKEND_URL}/tournaments/public/ongoing`),
      fetch(`${BACKEND_URL}/tournaments/public/upcoming`),
      fetch(`${BACKEND_URL}/tournaments/public/past`)
    ]);

    renderTournaments("ongoing", await ongoing.json());
    renderTournaments("upcoming", await upcoming.json());
    renderTournaments("past", await past.json());

  } catch (err) {
    console.error("Tournament fetch error:", err);
  }
}

function renderTournaments(tabId, tournaments) {
  const div = document.getElementById(tabId);

  if (!tournaments || tournaments.length === 0) {
    div.innerHTML = "No tournaments found";
    return;
  }

  div.innerHTML = tournaments.map(t => `
    <div class="card">
      <h4>${t.name}</h4>
      <p>Slots: ${t.slots}</p>
      <p>Prize: ₹${t.prizePool}</p>
      <p>Entry: ${t.entryType} ${t.entryFee ? "₹" + t.entryFee : ""}</p>
    </div>
  `).join("");
}

/* =========================
FETCH HOT SLOTS + BADGE
========================= */
async function fetchHotSlots() {
  try {
    const res = await fetch(`${BACKEND_URL}/hot-slots`);
    const slots = await res.json();

    const hotDiv = document.getElementById("hot");
    const badge = document.getElementById("hotBadge");

    if (!slots || slots.length === 0) {
      hotDiv.innerHTML = "No hot slots available";
      badge.style.display = "none";
      return;
    }

    const lastSeen = Number(localStorage.getItem("hotSlotCount") || 0);
    const newCount = slots.length - lastSeen;

    if (newCount > 0) {
      badge.innerText = newCount;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }

    hotDiv.innerHTML = slots.map(s => `
      <div class="card hot-slot">
        <h4>${s.tournament}</h4>
        <p>Prize: ₹${s.prizePool}</p>
        <p>Stage: ${s.stage}</p>
        <p>Slots: ${s.slots}</p>
        <a href="https://wa.me/91${s.contact}" target="_blank">
          Contact Host
        </a>
      </div>
    `).join("");

  } catch (err) {
    console.error("Hot slot fetch error:", err);
  }
}

/* =========================
CLEAR HOT BADGE
========================= */
function clearHotBadge() {
  const badge = document.getElementById("hotBadge");
  badge.style.display = "none";

  fetch(`${BACKEND_URL}/hot-slots`)
    .then(res => res.json())
    .then(slots => {
      localStorage.setItem("hotSlotCount", slots.length);
    });
}
