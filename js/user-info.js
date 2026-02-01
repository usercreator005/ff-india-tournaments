// js/user-info.js (PHASE 3 – STEP 3c FINAL)

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
   AUTH + PROFILE LOAD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Basic Firebase info
  document.getElementById("userName").innerText =
    user.displayName || "Player";
  document.getElementById("userEmail").innerText = user.email;
  document.getElementById("userUID").innerText = user.uid;

  try {
    const token = await getIdToken(user);

    /* =========================
       LOAD JOINED TOURNAMENTS
    ========================= */
    const res = await fetch(`${BACKEND_URL}/tournaments/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    document.getElementById("joinedCount").innerText =
      Array.isArray(data) ? data.length : 0;

    /* =========================
       LOAD USER AVATAR (DB)
    ========================= */
    const avatarRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (avatarRes.ok) {
      const userData = await avatarRes.json();
      if (userData.avatar) {
        setCurrentAvatar(userData.avatar);
      }
    }

  } catch (err) {
    console.error("Profile fetch error:", err);
  }
});

/* =========================
   AVATAR UI LOGIC
========================= */
const avatarImg = document.querySelector(".avatar-img");
const avatarOptions = document.querySelectorAll(".avatar-option");

// Highlight selected avatar
function setCurrentAvatar(code) {
  avatarImg.src = `assets/avatars/${code}.png`;

  avatarOptions.forEach(opt => {
    opt.classList.toggle(
      "selected",
      opt.getAttribute("alt") === code
    );
  });
}

/* =========================
   AVATAR CLICK → BACKEND
========================= */
avatarOptions.forEach(option => {
  option.addEventListener("click", async () => {
    const selectedAvatar = option.getAttribute("alt");

    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await getIdToken(user);

      const res = await fetch(`${BACKEND_URL}/user/avatar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          avatar: selectedAvatar
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.msg || "Avatar update failed");
      }

      // Update UI instantly
      setCurrentAvatar(selectedAvatar);

    } catch (err) {
      console.error("Avatar update error:", err);
      alert("Failed to update avatar. Try again.");
    }
  });
});
