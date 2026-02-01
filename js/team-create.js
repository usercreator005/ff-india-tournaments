import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

const teamNameInput = document.getElementById("teamName");
const createBtn = document.getElementById("createBtn");

/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

/* =========================
   CREATE TEAM
========================= */
createBtn.onclick = async () => {
  const name = teamNameInput.value.trim();

  if (!name) {
    alert("Please enter a team name");
    return;
  }

  createBtn.disabled = true;
  createBtn.innerText = "Creating...";

  try {
    const token = await getIdToken(auth.currentUser);

    const res = await fetch(`${BACKEND_URL}/team/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Team creation failed");
    }

    alert("Team created successfully!");
    window.location.href = "team.html";

  } catch (err) {
    alert(err.message);
  } finally {
    createBtn.disabled = false;
    createBtn.innerText = "Create Team";
  }
};
