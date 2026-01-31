// js/team.js (UPDATED – PRODUCTION SAFE)

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";
const box = document.getElementById("teamBox");

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

    const res = await fetch(`${BACKEND_URL}/team/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // ❌ If backend sends HTML / error page
    if (!res.ok) {
      throw new Error("Team fetch failed");
    }

    const data = await res.json();

    // Backend may return { success, team } OR direct team
    const team = data.team || data;

    if (!team || !team.name) {
      showEmpty();
      return;
    }

    renderTeam(team);

  } catch (err) {
    console.error("Team error:", err);
    box.innerHTML = `
      <div class="empty">
        <h3>Unable to load team</h3>
        <p>Please try again later.</p>
      </div>
    `;
  }
});

/* =========================
UI HELPERS
========================= */
function showEmpty() {
  box.innerHTML = `
    <div class="empty">
      <h3>No Team Created</h3>
      <p>You are not part of any team yet.</p>
    </div>
  `;
}

function renderTeam(team) {
  box.innerHTML = `
    <div class="card">
      <h3>${team.name}</h3>

      <div class="label">Captain</div>
      <div class="player">${team.captain}</div>

      <div class="label">Players</div>
      ${
        Array.isArray(team.players) && team.players.length
          ? team.players.map(p => `
              <div class="player">${p}</div>
            `).join("")
          : "<p class='muted'>No players added</p>"
      }
    </div>
  `;
}
