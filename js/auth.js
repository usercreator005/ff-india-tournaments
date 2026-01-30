// js/auth.js
// Google Login + Backend Role Verification (FINAL & STABLE)

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

/* =========================
   GOOGLE LOGIN BUTTON
========================= */
const googleBtn = document.getElementById("googleLoginBtn");

if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    googleBtn.disabled = true;

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const token = await user.getIdToken(true);
      const role = await fetchUserRole(token);

      redirectUser(role);

    } catch (err) {
      console.error("Google login failed:", err);
      alert("Google login failed. Please try again.");
      googleBtn.disabled = false;
    }
  });
}

/* =========================
   AUTO LOGIN (REFRESH SAFE)
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    const token = await user.getIdToken();
    const role = await fetchUserRole(token);
    redirectUser(role);
  } catch (err) {
    console.error("Session verification failed:", err);
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
   BACKEND ROLE FETCH
========================= */
async function fetchUserRole(idToken) {
  const res = await fetch(`${BACKEND_URL}/auth/role`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  });

  if (!res.ok) {
    throw new Error("Role fetch failed");
  }

  const data = await res.json();

  if (!data.role) {
    throw new Error("Invalid role response");
  }

  return data.role;
}

/* =========================
   REDIRECT HANDLER
========================= */
function redirectUser(role) {
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
