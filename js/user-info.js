// js/user-info.js
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userName").innerText =
    user.displayName || "Player";

  document.getElementById("userEmail").innerText = user.email;
  document.getElementById("userUID").innerText = user.uid;

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
