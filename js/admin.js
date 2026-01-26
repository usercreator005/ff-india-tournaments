// js/admin.js

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* =========================
   AUTH GUARD + BACKEND ROLE CHECK
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  console.log("Logged in:", user.email);

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

    if (data.role !== "admin") {
      alert("Access denied! You are not an admin.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    console.log("Role verified:", data.role);

  } catch (err) {
    console.error(err);
    alert("Authentication failed, redirecting...");
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
   NOTIFICATIONS
========================= */
const bell = document.getElementById("bell");
const panel = document.getElementById("notificationPanel");

bell.addEventListener("click", () => {
  panel.classList.toggle("active");
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
    alert("Logout failed");
  }
});

/* =========================
   TOGGLE CREATE / MANAGE
========================= */
const btnCreate = document.getElementById("btnCreate");
const btnManage = document.getElementById("btnManage");
const createForm = document.getElementById("createForm");
const manageSection = document.getElementById("manageSection");

btnCreate.addEventListener("click", () => {
  createForm.classList.remove("hidden");
  manageSection.classList.add("hidden");
});

btnManage.addEventListener("click", () => {
  manageSection.classList.remove("hidden");
  createForm.classList.add("hidden");
});

/* =========================
   ENTRY FEE CONDITION
========================= */
const entryType = document.getElementById("entryType");
const entryFee = document.getElementById("entryFee");

entryType.addEventListener("change", () => {
  if (entryType.value === "paid") {
    entryFee.classList.remove("hidden");
  } else {
    entryFee.classList.add("hidden");
  }
});
