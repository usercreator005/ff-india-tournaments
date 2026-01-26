// js/creator.js

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* =========================
   CREATOR AUTH GUARD + BACKEND ROLE CHECK
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const token = await getIdToken(user, true); // Firebase ID token
    const res = await fetch("https://ff-india-tournaments.onrender.com/auth/role", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Role verification failed");

    const data = await res.json();

    if (data.role !== "creator") {
      alert("Unauthorized access! You are not a creator.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    console.log("Creator verified:", data.email, data.role);

    // ✅ Update stats dynamically from backend if you want
    // Example: fetch("/creator/stats") -> update totalUsers, activeTournaments, totalAdmins

  } catch (err) {
    console.error(err);
    alert("Authentication failed. Redirecting...");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }
});

/* =========================
   DUMMY STATS (Frontend placeholders)
========================= */
document.getElementById("totalUsers").innerText = 128;
document.getElementById("activeTournaments").innerText = 4;
document.getElementById("totalAdmins").innerText = 2;

/* =========================
   TESTING SWITCHES
========================= */
document.getElementById("loginUser")
  .addEventListener("click", () => {
    window.location.href = "user.html";
  });

document.getElementById("loginAdmin")
  .addEventListener("click", () => {
    window.location.href = "admin.html";
  });

/* =========================
   HOT SLOT WHATSAPP LOGIC
========================= */
const numberInput = document.getElementById("contactNumber");
const dmNumber = document.getElementById("dmNumber");

numberInput.addEventListener("input", () => {
  dmNumber.innerText = numberInput.value || "—";
});

dmNumber.addEventListener("click", () => {
  const num = numberInput.value;
  if (!num) return;

  window.open(
    `https://wa.me/91${num}?text=DM%20ME%20FOR%20DETAILS%20-%20${num}`,
    "_blank"
  );
});
