import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const token = await getIdToken(user);

  const res = await fetch(`${BACKEND_URL}/auth/role`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (data.role !== "admin") {
    alert("Access denied");
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
   UI CONTROLS
========================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logout");

avatar.onclick = () => sidebar.classList.toggle("active");
logoutBtn.onclick = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

/* =========================
   FORM TOGGLE
========================= */
const btnCreate = document.getElementById("btnCreate");
const btnManage = document.getElementById("btnManage");
const createForm = document.getElementById("createForm");
const manageSection = document.getElementById("manageSection");

btnCreate.onclick = () => {
  createForm.classList.remove("hidden");
  manageSection.classList.add("hidden");
};

btnManage.onclick = () => {
  manageSection.classList.remove("hidden");
  createForm.classList.add("hidden");
  fetchTournaments();
};

/* =========================
   PAID TOGGLE
========================= */
const entryType = document.getElementById("entryType");
const entryFee = document.getElementById("entryFee");
const upiId = document.getElementById("upiId");

entryType.onchange = () => {
  const paid = entryType.value === "paid";
  entryFee.classList.toggle("hidden", !paid);
  upiId.classList.toggle("hidden", !paid);
};

/* =========================
   CREATE TOURNAMENT
========================= */
createForm.querySelector(".submit").onclick = async () => {
  const token = await getIdToken(auth.currentUser);

  const body = {
    name: tournamentName.value,
    slots: Number(slots.value),
    prizePool: prizePool.value,
    entryType: entryType.value,
    entryFee: Number(entryFee.value) || 0,
    upiId: upiId.value
  };

  const res = await fetch(`${BACKEND_URL}/tournaments/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  alert(data.msg);
};

/* =========================
   FETCH ADMIN TOURNAMENTS
========================= */
async function fetchTournaments() {
  const token = await getIdToken(auth.currentUser);

  const res = await fetch(`${BACKEND_URL}/tournaments/admin/upcoming`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const list = document.getElementById("tournamentList");
  const tournaments = await res.json();

  list.innerHTML = tournaments.map(t => `
    <div class="tournament-card">
      <h4>${t.name}</h4>
      <p>${t.entryType} ${t.entryFee ? "₹" + t.entryFee : ""}</p>
      <p>UPI: ${t.payment?.upiId || "-"}</p>
    </div>
  `).join("");
  }
