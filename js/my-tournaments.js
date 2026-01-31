// js/my-tournaments.js (UPDATED – PRODUCTION SAFE)

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";
const list = document.getElementById("tournamentList");

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

    const res = await fetch(`${BACKEND_URL}/tournaments/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // ❌ backend error / HTML page
    if (!res.ok) {
      throw new Error("My tournaments fetch failed");
    }

    const data = await res.json();

    // backend may return { success, tournaments } OR direct array
    const tournaments = data.tournaments || data;

    if (!Array.isArray(tournaments) || !tournaments.length) {
      showEmpty();
      return;
    }

    renderList(tournaments);

  } catch (err) {
    console.error("My tournaments error:", err);
    list.innerHTML = `
      <p class="loading">Failed to load tournaments</p>
    `;
  }
});

/* =========================
UI HELPERS
========================= */
function showEmpty() {
  list.innerHTML = `
    <div class="empty">
      <h3>No Tournaments Joined</h3>
      <p>You have not joined any tournament yet.</p>
    </div>
  `;
}

function renderList(items) {
  list.innerHTML = items.map(t => {
    const status = (t.status || "pending").toLowerCase();

    return `
      <div class="card">
        <h3>${t.name}</h3>

        <div class="meta">Prize: ₹${t.prizePool}</div>
        <div class="meta">Slots: ${t.slots}</div>

        <span class="status ${status}">
          ${(t.status || "PENDING").toUpperCase()}
        </span>
      </div>
    `;
  }).join("");
    }
