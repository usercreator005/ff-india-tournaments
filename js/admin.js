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
  if (!user) return location.href = "index.html";

  const token = await getIdToken(user);
  const res = await fetch(`${BACKEND_URL}/auth/role`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (data.role !== "admin") {
    alert("Admin access only");
    await signOut(auth);
    location.href = "index.html";
  }
});

/* =========================
   UI
========================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logout");

avatar.onclick = () => sidebar.classList.toggle("active");
logoutBtn.onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};

/* =========================
   TOGGLE SECTIONS
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
const paidBox = document.getElementById("paidBox");

entryType.onchange = () => {
  paidBox.classList.toggle("hidden", entryType.value !== "paid");
};

/* =========================
   CREATE TOURNAMENT
========================= */
document.querySelector(".submit").onclick = async () => {
  const token = await getIdToken(auth.currentUser);

  const name = tournamentName.value.trim();
  const slotCount = Number(slots.value);
  const prize = prizePool.value.trim();
  const type = entryType.value;

  if (!name || !slotCount || !prize || !type) {
    return alert("Please fill all required fields");
  }

  const body = {
    name,
    slots: slotCount,
    prizePool: prize,
    entryType: type,
    entryFee: type === "paid" ? Number(entryFee.value) : 0,
    payment: type === "paid" ? { upiId: upiId.value.trim() } : null
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
  alert(data.msg || "Done");
  createForm.reset();
  paidBox.classList.add("hidden");
};

/* =========================
   FETCH TOURNAMENTS
========================= */
async function fetchTournaments() {
  const token = await getIdToken(auth.currentUser);
  const res = await fetch(`${BACKEND_URL}/tournaments/admin/upcoming`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const tournaments = await res.json();
  const list = document.getElementById("tournamentList");

  if (!tournaments.length) {
    list.innerHTML = "<p>No tournaments found</p>";
    return;
  }

  list.innerHTML = tournaments.map(t => `
    <div class="tournament-card">
      <h4>${t.name}</h4>
      <p>Entry: ${t.entryType}</p>
      <p>Fee: ${t.entryFee ? "₹" + t.entryFee : "-"}</p>
      <p>UPI: ${t.payment?.upiId || "-"}</p>
    </div>
  `).join("");
}
