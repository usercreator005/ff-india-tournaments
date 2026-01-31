import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";
const box = document.getElementById("teamBox");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  try {
    const token = await getIdToken(user);

    const res = await fetch(`${BACKEND_URL}/team/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const team = await res.json();

    if (!team || !team.name) {
      box.innerHTML = `
        <div class="empty">
          <h3>No Team Created</h3>
          <p>You are not part of any team yet.</p>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="card">
        <h3>${team.name}</h3>

        <div class="label">Captain</div>
        <div class="player">${team.captain}</div>

        <div class="label">Players</div>
        ${team.players.map(p => `
          <div class="player">${p}</div>
        `).join("")}
      </div>
    `;

  } catch (err) {
    console.error(err);
    box.innerHTML = "<p class='loading'>Failed to load team info</p>";
  }
});
