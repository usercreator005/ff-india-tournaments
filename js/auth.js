// js/auth.js
// Firebase Google Login – Modular v9 + Backend Role Verification

import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { BACKEND_URL } from "./config.js"; // Make sure js/config.js exists

// Button safety check
const googleBtn = document.getElementById("googleLoginBtn");

if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("Logged in:", user.email);

      // ✅ Get Firebase ID Token
      const idToken = await user.getIdToken();

      // ✅ Call backend to get role
      const role = await fetchRoleFromBackend(idToken);

      // ✅ Redirect based on role
      redirectUser(role);

    } catch (err) {
      alert(err.message);
      console.error("Login error:", err);
    }
  });
}

// 🔁 Handle already logged-in user (refresh / back button safe)
onAuthStateChanged(auth, async (user) => {
  if (!user) return; // Not logged in

  try {
    const idToken = await user.getIdToken();
    const role = await fetchRoleFromBackend(idToken);
    redirectUser(role);
  } catch (err) {
    console.error("Role verification failed:", err);
    await auth.signOut();
    window.location.href = "index.html";
  }
});

// ========================
// Fetch role from backend
// ========================
async function fetchRoleFromBackend(idToken) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch role");

    const data = await res.json();
    console.log("Backend role:", data.role);
    return data.role;

  } catch (err) {
    console.error("Backend auth error:", err);
    throw err;
  }
}

// ========================
// Central redirect logic
// ========================
function redirectUser(role) {
  switch (role) {
    case "creator":
      window.location.href = "creator.html";
      break;
    case "admin":
      window.location.href = "admin.html";
      break;
    case "user":
    default:
      window.location.href = "user.html";
      break;
  }
}
