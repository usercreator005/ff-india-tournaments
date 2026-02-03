import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

const teamNameInput = document.getElementById("teamName");
const whatsappInput = document.getElementById("whatsapp");
const createBtn = document.getElementById("createBtn");

/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

/* =========================
   CREATE TEAM
========================= */
createBtn.onclick = async () => {
  const name = teamNameInput.value.trim();
  const whatsapp = whatsappInput.value.trim();

  if (!name) {
    alert("Please enter a team name");
    return;
  }

  if (!/^[6-9]\d{9}$/.test(whatsapp)) {
    alert("Enter a valid 10-digit WhatsApp number");
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
      body: JSON.stringify({
        name,
        whatsapp
      })
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
