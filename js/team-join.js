// js/team-join.js
// JOIN TEAM BY INVITE CODE – PRODUCTION SAFE

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

const input = document.getElementById("inviteCodeInput");
const joinBtn = document.getElementById("joinBtn");

/* =========================
   PAGE GUARD
========================= */
if (!input || !joinBtn) {
  console.warn("team-join.js loaded on wrong page");
} else {

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
     JOIN TEAM (BY INVITE CODE)
  ========================= */
  joinBtn.addEventListener("click", async () => {
    const inviteCode = input.value.trim().toUpperCase();

    if (!inviteCode) {
      alert("Please enter invite code");
      return;
    }

    joinBtn.disabled = true;
    joinBtn.textContent = "Joining...";

    try {
      const res = await fetch(
        `${BACKEND_URL}/team/join-by-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ inviteCode })
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
}
