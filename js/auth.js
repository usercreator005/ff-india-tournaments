// js/auth.js
// GOOGLE LOGIN + BACKEND ROLE VERIFICATION (STABLE BUILD)

import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ================= CONFIG ================= */
const BACKEND_URL = "https://ff-india-tournaments.onrender.com";
let isRedirecting = false;

/* ================= PAGE DETECTION ================= */
const CURRENT_PAGE = window.location.pathname.split("/").pop();

/* ================= GOOGLE LOGIN ================= */
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
      const token = await result.user.getIdToken(true);

      const role = await fetchUserRole(token);
      redirectUser(role);

    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed. Try again.");

      googleBtn.disabled = false;
      googleBtn.innerText = "Continue with Google";
    }
  });
}

/* ================= AUTO SESSION RESTORE ================= */
// Only runs on landing page to avoid dashboard loops
onAuthStateChanged(auth, async (user) => {
  if (!user || isRedirecting) return;
  if (CURRENT_PAGE && CURRENT_PAGE !== "index.html") return;

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

/* ================= FETCH ROLE ================= */
async function fetchUserRole(idToken) {
  const res = await fetch(`${BACKEND_URL}/auth/role`, {
    headers: { Authorization: `Bearer ${idToken}` }
  });

  if (!res.ok) throw new Error("Role fetch failed");

  const data = await res.json();
  if (!data.role) throw new Error("Invalid role response");

  return data.role;
}

/* ================= REDIRECT ================= */
function redirectUser(role) {
  if (isRedirecting) return;
  isRedirecting = true;

  if (role === "admin") {
    window.location.replace("admin.html");
  } else if (role === "creator") {
    window.location.replace("creator.html");
  } else {
    window.location.replace("user.html");
  }
      }
