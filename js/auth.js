// js/auth.js
// Google Login + Backend Role Verification
// FINAL • STABLE • PRODUCTION READY • RENDER COLD-START SAFE

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
   GOOGLE LOGIN BUTTON
========================= */
const googleBtn = document.getElementById("googleLoginBtn");

if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    if (googleBtn.disabled) return;

    googleBtn.disabled = true;
    googleBtn.innerText = "Connecting to Google...";

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const token = await user.getIdToken(true);

      // 🔥 Cold-start safe role fetch
      const role = await fetchUserRoleWithRetry(token);

      redirectUser(role);

    } catch (err) {
      console.error("Google login failed:", err);
      alert("Login failed. Please try again.");

      googleBtn.disabled = false;
      googleBtn.innerText = "Continue with Google";
    }
  });
}

/* =========================
   AUTO LOGIN (SESSION SAFE)
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user || isRedirecting) return;

  try {
    const token = await user.getIdToken();

    // 🔥 Cold-start safe role fetch
    const role = await fetchUserRoleWithRetry(token);

    redirectUser(role);

  } catch (err) {
    console.error("Session verification failed:", err);
    await signOut(auth);
    window.location.replace("index.html");
  }
});

/* =========================
   BACKEND ROLE FETCH (RETRY)
========================= */
async function fetchUserRoleWithRetry(idToken, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/role`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data || !data.role) {
        throw new Error("Invalid role response");
      }

      return data.role;

    } catch (err) {
      lastError = err;
      console.warn(`Role fetch attempt ${attempt} failed`);

      // ⏳ Render cold start wait
      await new Promise(res => setTimeout(res, 1500));
    }
  }

  throw lastError;
}

/* =========================
   REDIRECT HANDLER (HARD SAFE)
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

    case "user":
    default:
      window.location.replace("user.html");
      break;
  }
  }
