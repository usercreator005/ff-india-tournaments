import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";
const list = document.getElementById("tournamentList");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  try {
    const token = await getIdToken(user);

    const res = await fetch(`${BACKEND_URL}/tournaments/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      list.innerHTML = "<p class='loading'>No tournaments joined yet.</p>";
      return;
    }

    list.innerHTML = data.map(t => `
      <div class="card">
        <h3>${t.name}</h3>
        <div class="meta">Prize: ₹${t.prizePool}</div>
        <div class="meta">Slots: ${t.slots}</div>

        <span class="status ${t.status?.toLowerCase() || "pending"}">
          ${(t.status || "PENDING").toUpperCase()}
        </span>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    list.innerHTML = "<p class='loading'>Failed to load tournaments</p>";
  }
});
