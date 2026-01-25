// js/auth.js
// Firebase Google Login – Modular v9 (SAFE VERSION)

import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Button safety check
const googleBtn = document.getElementById("googleLoginBtn");

if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("Logged in:", user.email);

      redirectUser(user.email);

    } catch (err) {
      alert(err.message);
      console.error("Login error:", err);
    }
  });
}

// 🔁 Handle already logged-in user (refresh / back button safe)
onAuthStateChanged(auth, (user) => {
  if (user) {
    redirectUser(user.email);
  }
});

// 🔀 Central redirect logic (future backend-ready)
function redirectUser(email) {
  if (email === "jarahul989@gmail.com") {
    window.location.href = "creator.html";
  } else {
    window.location.href = "user.html";
  }
}
