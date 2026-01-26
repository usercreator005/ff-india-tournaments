// js/user.js (Backend Integrated)

// Firebase Auth (Modular)
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
   AUTH GUARD + BACKEND ROLE CHECK
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    // Firebase token
    const token = await getIdToken(user);

    // Backend role check
    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Unauthorized");

    const data = await res.json();

    if (data.role !== "user") {
      alert("Access denied! You are not a user.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    console.log("User logged in:", user.email, "Role:", data.role);

    // TODO: Fetch user-specific data like My Tournaments / notifications here
    // fetchTournaments(token);

  } catch (err) {
    console.error("Auth error:", err);
    alert("Session expired or unauthorized. Please login again.");
    await signOut(auth);
    window.location.href = "index.html";
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
   LOGOUT
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
    document.getElementById(btn.dataset.tab).classList.add("active");
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
