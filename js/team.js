// js/team.js
// FINAL – TEAM MODULE (JOIN + LEAVE + DISBAND FIXED & STABLE)

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

const box = document.getElementById("teamBox");
const noTeamActions = document.getElementById("noTeamActions");

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
   LOAD MY TEAM
========================= */
async function loadMyTeam() {
  try {
    const res = await fetch(`${BACKEND_URL}/team/my`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON response");
    }

    if (!data.success || !data.hasTeam) {
      showNoTeamState();
      return;
    }

    renderTeam(data.team);

  } catch (err) {
    console.error("Team load error:", err);
    box.innerHTML = `<p class="empty">Unable to load team</p>`;
  }
}

/* =========================
   NO TEAM UI
========================= */
function showNoTeamState() {
  box.innerHTML = "";
  if (noTeamActions) noTeamActions.style.display = "block";
}

/* =========================
   RENDER TEAM
========================= */
function renderTeam(team) {
  if (noTeamActions) noTeamActions.style.display = "none";

  const players = Array.isArray(team.players) ? team.players : [];
  const isCaptain = team.captain === currentUserEmail;

  box.innerHTML = `
    <div class="card">
      <h3>${team.name}</h3>

      <div class="label">Captain</div>
      <div class="player captain">
        ${team.captain}
        <span>Captain</span>
      </div>

      <div class="label">Members</div>
      ${
        players.map(email => `
          <div class="player ${email === team.captain ? "captain" : "playing"}">
            ${email}
            <span>${email === team.captain ? "Captain" : "Member"}</span>
          </div>
        `).join("")
      }

      <div class="label">Team Size</div>
      <p class="label">${players.length} / 6 Players</p>

      <div class="action-row">
        ${
          isCaptain
            ? `<button id="disbandBtn" class="btn danger">❌ Disband Team</button>`
            : `<button id="leaveBtn" class="btn secondary">🚪 Leave Team</button>`
        }
      </div>
    </div>
  `;

  bindActions(isCaptain);
}

/* =========================
   ACTION BINDING
========================= */
function bindActions(isCaptain) {
  if (isCaptain) {
    const disbandBtn = document.getElementById("disbandBtn");
    if (disbandBtn) disbandBtn.onclick = disbandTeam;
  } else {
    const leaveBtn = document.getElementById("leaveBtn");
    if (leaveBtn) leaveBtn.onclick = leaveTeam;
  }
}

/* =========================
   LEAVE TEAM
========================= */
async function leaveTeam() {
  if (!confirm("Are you sure you want to leave the team?")) return;

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

    alert("You left the team");
    showNoTeamState();

  } catch (err) {
    console.error("Leave error:", err);
    alert("Server error");
  }
}

/* =========================
   DISBAND TEAM (DELETE)
========================= */
async function disbandTeam() {
  if (!confirm("This will remove all members. Continue?")) return;

  try {
    const res = await fetch(`${BACKEND_URL}/team/disband`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid response");
    }

    if (!data.success) {
      alert(data.msg || "Failed to disband team");
      return;
    }

    alert("Team disbanded successfully");
    showNoTeamState();

  } catch (err) {
    console.error("Disband error:", err);
    alert("Server error");
  }
                    }
