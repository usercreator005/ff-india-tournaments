// js/team.js
// FINAL – TEAM MODULE (USERNAME BASED • CAPTAIN INCLUDED • NO DUPLICATION)

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

const box = document.getElementById("teamBox");
const noTeamActions = document.getElementById("noTeamActions");

let currentUsername = null;
let authToken = null;

/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  authToken = await getIdToken(user);
  await loadMyTeam();
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

    const data = await res.json();

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

  const members = Array.isArray(team.members) ? team.members : [];
  const captainUsername = team.captain;

  const isCaptain = members.includes(captainUsername);

  // captain ko members list se hatao (UI ke liye)
  const otherMembers = members.filter(
    member => member !== captainUsername
  );

  const MAX_PLAYERS = 6;
  const totalPlayers = members.length;

  box.innerHTML = `
    <div class="card">
      <h3>${team.name}</h3>

      ${
        isCaptain && team.inviteCode
          ? `
            <div class="label">Invite Code</div>
            <div class="invite-code" id="inviteCodeBox">
              ${team.inviteCode}
            </div>
            <button class="btn secondary" id="copyInviteBtn">
              📋 Copy Invite Code
            </button>
          `
          : ""
      }

      <div class="label">Captain</div>
      <div class="player captain">
        ${captainUsername}
        <span>Captain</span>
      </div>

      <div class="label">Members</div>
      ${
        otherMembers.length > 0
          ? otherMembers.map(member => `
              <div class="player playing">
                ${member}
                <span>Member</span>
              </div>
            `).join("")
          : `<p class="empty">No other members</p>`
      }

      <div class="label">Team Size</div>
      <p class="label">${totalPlayers} / ${MAX_PLAYERS} Players</p>

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
  bindInviteCopy(team.inviteCode, isCaptain);
}

/* =========================
   COPY INVITE CODE
========================= */
function bindInviteCopy(inviteCode, isCaptain) {
  if (!isCaptain || !inviteCode) return;

  const btn = document.getElementById("copyInviteBtn");
  if (!btn) return;

  btn.onclick = () => {
    navigator.clipboard.writeText(inviteCode);
    btn.innerText = "✅ Copied!";
    setTimeout(() => {
      btn.innerText = "📋 Copy Invite Code";
    }, 1500);
  };
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
      alert(data.message || "Failed to leave team");
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
   DISBAND TEAM
========================= */
async function disbandTeam() {
  if (!confirm("This will remove all members. Continue?")) return;

  try {
    const res = await fetch(`${BACKEND_URL}/team/disband`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    const data = await res.json();
    if (!data.success) {
      alert(data.message || "Failed to disband team");
      return;
    }

    alert("Team disbanded successfully");
    showNoTeamState();

  } catch (err) {
    console.error("Disband error:", err);
    alert("Server error");
  }
  }
