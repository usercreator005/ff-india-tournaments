// js/team.js
// FINAL – TEAM MODULE (UI + BACKEND ALIGNED + NO TEAM ACTIONS)

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

const box = document.getElementById("teamBox");
const noTeamActions = document.getElementById("noTeamActions");

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

    if (!res.ok) throw new Error("Team fetch failed");

    const data = await res.json();

    /*
      Expected backend response:
      {
        success: true,
        hasTeam: true/false,
        team: {
          name: string,
          captain: string,
          players: [string]
        }
      }
    */

    if (!data.success || !data.hasTeam || !data.team) {
      showNoTeamState();
      return;
    }

    renderTeam(data.team);

  } catch (err) {
    console.error("Team error:", err);
    box.innerHTML = `
      <div class="empty">
        <h3>Unable to load team</h3>
        <p>Please try again later.</p>
      </div>
    `;
    if (noTeamActions) noTeamActions.style.display = "none";
  }
});

/* =========================
   NO TEAM STATE
========================= */
function showNoTeamState() {
  box.innerHTML = "";
  if (noTeamActions) {
    noTeamActions.style.display = "block";
  }
}

/* =========================
   RENDER TEAM
========================= */
function renderTeam(team) {
  if (noTeamActions) {
    noTeamActions.style.display = "none";
  }

  const players = Array.isArray(team.players) ? team.players : [];

  const playing = players.slice(0, 4); // Playing 4
  const subs = players.slice(4, 6);    // Substitutes 2

  box.innerHTML = `
    <div class="card">
      <h3>${team.name}</h3>

      <div class="label">Captain</div>
      <div class="player captain">
        ${team.captain}
        <span>Captain</span>
      </div>

      <div class="label">Playing Squad (4)</div>
      ${
        playing.length
          ? playing.map(p => `
              <div class="player playing">
                ${p}
                <span>Playing</span>
              </div>
            `).join("")
          : `<p class="label">No playing members</p>`
      }

      <div class="label">Substitutes (2)</div>
      ${
        subs.length
          ? subs.map(p => `
              <div class="player sub">
                ${p}
                <span>Sub</span>
              </div>
            `).join("")
          : `<p class="label">No substitutes</p>`
      }

      <div class="label">Team Size</div>
      <p class="label">${players.length} / 6 Players</p>
    </div>
  `;
}
