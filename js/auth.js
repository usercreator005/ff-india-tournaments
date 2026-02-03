// js/auth.js
// Google Login + Backend Role Verification
// FINAL • STABLE • NO /auth/login • RENDER SAFE

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

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const token = await user.getIdToken(true);

      const role = await fetchUserRole(token);
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
   AUTO SESSION LOGIN
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user || isRedirecting) return;

  try {
    const token = await user.getIdToken();
    const role = await fetchUserRole(token);
    redirectUser(role);
  } catch (err) {
    console.error("Session restore failed:", err);
    await signOut(auth);
    window.location.replace("index.html");
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
      break;
  }
                                          }
