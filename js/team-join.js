// js/team-join.js
// JOIN TEAM – PRODUCTION SAFE

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

const input = document.getElementById("teamIdInput");
const joinBtn = document.getElementById("joinBtn");

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
});

/* =========================
   JOIN TEAM
========================= */
joinBtn.addEventListener("click", async () => {
  const teamId = input.value.trim();

  if (!teamId) {
    alert("Please enter Team ID");
    return;
  }

  joinBtn.disabled = true;
  joinBtn.textContent = "Joining...";

  try {
    const res = await fetch(
      `${BACKEND_URL}/team/join/${teamId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid server response");
    }

    if (!data.success) {
      alert(data.msg || "Unable to join team");
      return;
    }

    alert("Successfully joined the team 🎉");
    window.location.href = "team.html";

  } catch (err) {
    console.error("Join error:", err);
    alert("Server error");
  } finally {
    joinBtn.disabled = false;
    joinBtn.textContent = "🚀 Join Team";
  }
});
