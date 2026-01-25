// js/user.js

// Firebase Auth (Modular)
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    console.log("User logged in:", user.email);
  }
});

/* =========================
   SIDEBAR TOGGLE
========================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");

avatar.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

/* =========================
   LOGOUT (FIXED)
========================= */
const logoutBtn = document.getElementById("logout");

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
    alert("Logout failed. Try again.");
  }
});

/* =========================
   TABS SWITCHING
========================= */
const tabBtns = document.querySelectorAll(".tab-btn");
const tabs = document.querySelectorAll(".tab");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    tabs.forEach((t) => t.classList.remove("active"));

    btn.classList.add("active");
    document
      .getElementById(btn.dataset.tab)
      .classList.add("active");
  });
});

/* =========================
   NOTIFICATION PANEL
========================= */
const bell = document.getElementById("notificationBell");
const panel = document.getElementById("notificationPanel");

bell.addEventListener("click", () => {
  panel.classList.toggle("active");
});
