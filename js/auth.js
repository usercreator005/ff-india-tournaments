import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const googleBtn = document.getElementById("googleLoginBtn");

googleBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("Logged in:", user.email);

    // TEMP ROLE LOGIC (Phase 1)
    if (user.email === "jarahul989@gmail.com") {
      window.location.href = "creator.html";
    } else {
      window.location.href = "user.html";
    }

  } catch (err) {
    alert(err.message);
    console.error(err);
  }
});
