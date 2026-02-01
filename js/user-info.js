// js/user-info.js (PHASE 3 – STEP 2)

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  /* =========================
     BASIC USER INFO
  ========================= */
  document.getElementById("userName").innerText =
    user.displayName || "Player";

  document.getElementById("userEmail").innerText = user.email;
  document.getElementById("userUID").innerText = user.uid;

  /* =========================
     AVATAR LOAD (LOCAL FIRST)
  ========================= */
  const savedAvatar = localStorage.getItem("userAvatar") || "a1";
  setCurrentAvatar(savedAvatar);

  /* =========================
     TOURNAMENT COUNT
  ========================= */
  try {
    const token = await getIdToken(user);

    const res = await fetch(`${BACKEND_URL}/tournaments/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    document.getElementById("joinedCount").innerText =
      Array.isArray(data) ? data.length : 0;

  } catch (err) {
    console.error("Profile fetch error:", err);
  }
});

/* =========================
   AVATAR SELECTION (UI)
========================= */
const avatarOptions = document.querySelectorAll(".avatar-option");

avatarOptions.forEach((img) => {
  img.addEventListener("click", () => {
    const avatar = img.dataset.avatar;
    if (!avatar) return;

    setCurrentAvatar(avatar);
    localStorage.setItem("userAvatar", avatar);

    // 🔒 Backend sync will be added in Phase 4
  });
});

/* =========================
   HELPERS
========================= */
function setCurrentAvatar(avatar) {
  const current = document.getElementById("currentAvatar");
  if (!current) return;

  current.src = `assets/avatars/${avatar}.png`;
  current.dataset.avatar = avatar;

  // Active border handling
  avatarOptions.forEach((img) => {
    img.classList.toggle(
      "active",
      img.dataset.avatar === avatar
    );
  });
}
