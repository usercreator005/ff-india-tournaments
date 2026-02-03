// js/auth.js
// Google Login + Backend JWT + Role Verification
// FINAL • PRODUCTION • TOKEN SAFE

import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* =========================
   CONFIG
========================= */
const BACKEND_URL = "https://ff-india-tournaments.onrender.com";
let isRedirecting = false;

/* =========================
   GOOGLE LOGIN
========================= */
const googleBtn = document.getElementById("googleLoginBtn");

if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    if (googleBtn.disabled) return;

    googleBtn.disabled = true;
    googleBtn.innerText = "Connecting...";

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await handleBackendLogin(user);

    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed");

      googleBtn.disabled = false;
      googleBtn.innerText = "Continue with Google";
    }
  });
}

/* =========================
   AUTO SESSION LOGIN
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user || isRedirecting) return;

  try {
    await handleBackendLogin(user);
  } catch (err) {
    console.error("Session restore failed:", err);
    await signOut(auth);
    localStorage.clear();
    window.location.replace("index.html");
  }
});

/* =========================
   BACKEND LOGIN + TOKEN SAVE
========================= */
async function handleBackendLogin(user) {
  const firebaseToken = await user.getIdToken(true);

  // 🔐 Backend login (JWT issue)
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${firebaseToken}`
    }
  });

  if (!res.ok) {
    throw new Error("Backend login failed");
  }

  const data = await res.json();

  if (!data.token || !data.role) {
    throw new Error("Invalid backend auth response");
  }

  // ✅ VERY IMPORTANT
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.role);

  redirectUser(data.role);
}

/* =========================
   REDIRECT
========================= */
function redirectUser(role) {
  if (isRedirecting) return;
  isRedirecting = true;

  switch (role) {
    case "creator":
      window.location.replace("creator.html");
      break;
    case "admin":
      window.location.replace("admin.html");
      break;
    default:
      window.location.replace("user.html");
  }
}
