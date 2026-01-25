// js/creator.js

// Firebase Auth (Modular)
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* =========================
   CREATOR AUTH GUARD (LOCKED)
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // HARD CREATOR LOCK
  if (user.email !== "jarahul989@gmail.com") {
    alert("Unauthorized access!");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  console.log("Creator logged in:", user.email);
});

/* =========================
   DUMMY STATS (Backend Phase)
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
