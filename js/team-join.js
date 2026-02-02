// js/team-join.js
// JOIN TEAM BY INVITE CODE – PRODUCTION READY

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

const input = document.getElementById("inviteCodeInput");
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
   JOIN TEAM (INVITE CODE)
========================= */
joinBtn.addEventListener("click", async () => {
  const inviteCode = input.value.trim().toUpperCase();

  if (!inviteCode || inviteCode.length < 5) {
    alert("Please enter a valid invite code");
    return;
  }

  joinBtn.disabled = true;
  joinBtn.textContent = "Joining...";

  try {
    const res = await fetch(
      `${BACKEND_URL}/team/join-by-code/${inviteCode}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    const data = await res.json();

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
