import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");
const hotBadge = document.getElementById("hotBadge");

avatar.onclick = () => sidebar.classList.toggle("active");

document.querySelectorAll(".sidebar-section").forEach(item => {
  item.addEventListener("click", () => {
    const tab = item.dataset.tab;
    if (!tab) return;
    activateTab(tab);
    sidebar.classList.remove("active");
  });
});

document.getElementById("logout").onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.onclick = () => activateTab(btn.dataset.tab);
});

function activateTab(tabId) {
  document.querySelectorAll(".tab-btn,.tab")
    .forEach(el => el.classList.remove("active"));

  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add("active");
  document.getElementById(tabId)?.classList.add("active");

  if (tabId === "hot") {
    localStorage.setItem("lastHotSeen", Date.now());
    hotBadge.style.display = "none";
  }
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";
  await fetchTournaments();
  await fetchHotSlots();
});

/* ================= TOURNAMENTS ================= */
async function fetchTournaments() {
  ["ongoing","upcoming","past"].forEach(async status => {
    const res = await fetch(`${BACKEND_URL}/tournaments/public/${status}`);
    const data = await res.json();
    document.getElementById(status).innerHTML =
      data.length ? data.map(t => `
        <div class="card">
          <h4>${t.name}</h4>
          <p>Prize: ${t.prizePool}</p>
          <p>Slots: ${t.slots}</p>
        </div>`).join("") : "No tournaments";
  });
}

/* ================= HOT SLOTS + NOTIFICATION ================= */
async function fetchHotSlots() {
  const res = await fetch(`${BACKEND_URL}/hot-slots`);
  const slots = await res.json();

  const hotDiv = document.getElementById("hot");
  hotDiv.innerHTML = slots.map(s => `
    <div class="card hot-slot">
      <h4>${s.tournament}</h4>
      <p>${s.prizePool}</p>
      <a href="https://wa.me/91${s.contact}" target="_blank">WhatsApp</a>
    </div>
  `).join("");

  const lastSeen = Number(localStorage.getItem("lastHotSeen") || 0);
  const newCount = slots.filter(s => new Date(s.createdAt).getTime() > lastSeen).length;

  if (newCount > 0) {
    hotBadge.innerText = newCount;
    hotBadge.style.display = "inline-block";
  }
}
