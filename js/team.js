// js/team.js
// FINAL – TEAM MODULE (UI + BACKEND ALIGNED + ACTIONS SAFE)

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

const box = document.getElementById("teamBox");
const noTeamActions = document.getElementById("noTeamActions");
const teamActions = document.getElementById("teamActions");
const leaveBtn = document.getElementById("leaveTeamBtn");
const disbandBtn = document.getElementById("disbandTeamBtn");

let currentUserEmail = null;
let authToken = null;

/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUserEmail = user.email;
  authToken = await getIdToken(user);

  loadMyTeam();
});

/* =========================
   LOAD TEAM
========================= */
async function loadMyTeam() {
  try {
    const res = await fetch(`${BACKEND_URL}/team/my`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    if (!res.ok) throw new Error("Team fetch failed");

    const data = await res.json();

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
    hideAllActions();
  }
}

/* =========================
   NO TEAM STATE
========================= */
function showNoTeamState() {
  box.innerHTML = "";
  hideAllActions();
  if (noTeamActions) noTeamActions.style.display = "block";
}

/* =========================
   RENDER TEAM
========================= */
function renderTeam(team) {
  if (noTeamActions) noTeamActions.style.display = "none";

  const players = Array.isArray(team.players) ? team.players : [];
  const playing = players.slice(0, 4);
  const subs = players.slice(4, 6);

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

  setupActions(team);
}

/* =========================
   ACTION VISIBILITY
========================= */
function setupActions(team) {
  hideAllActions();

  if (!teamActions) return;

  teamActions.style.display = "block";

  const isCaptain = team.captain === currentUserEmail;

  if (isCaptain) {
    if (disbandBtn) disbandBtn.style.display = "inline-block";
  } else {
    if (leaveBtn) leaveBtn.style.display = "inline-block";
  }
}

/* =========================
   HIDE ACTIONS
========================= */
function hideAllActions() {
  if (noTeamActions) noTeamActions.style.display = "none";
  if (teamActions) teamActions.style.display = "none";
  if (leaveBtn) leaveBtn.style.display = "none";
  if (disbandBtn) disbandBtn.style.display = "none";
}

/* =========================
   LEAVE TEAM
========================= */
if (leaveBtn) {
  leaveBtn.addEventListener("click", async () => {
    const ok = confirm("Are you sure you want to leave this team?");
    if (!ok) return;

    try {
      const res = await fetch(`${BACKEND_URL}/team/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.msg || "Failed to leave team");
        return;
      }

      alert("You have left the team");
      showNoTeamState();

    } catch (err) {
      console.error("Leave team error:", err);
      alert("Server error");
    }
  });
}

/* =========================
   DISBAND TEAM
========================= */
if (disbandBtn) {
  disbandBtn.addEventListener("click", async () => {
    const ok = confirm(
      "Disbanding the team will remove all members. Continue?"
    );
    if (!ok) return;

    try {
      const res = await fetch(`${BACKEND_URL}/team/disband`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.msg || "Failed to disband team");
        return;
      }

      alert("Team disbanded successfully");
      showNoTeamState();

    } catch (err) {
      console.error("Disband team error:", err);
      alert("Server error");
    }
  });
}
