// js/user.js
// USER DASHBOARD + JOIN TOURNAMENT SYSTEM (UPDATED)

// Firebase Auth
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
   ELEMENTS
========================= */
const sidebar = document.getElementById("sidebar");
const headerAvatar = document.getElementById("headerAvatar");
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");

/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return (location.href = "index.html");

  try {
    const token = await getIdToken(user);
    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (data.role !== "user") throw new Error("Not user");

    sidebarUserName.innerText = user.displayName || "Player";
    await loadUserAvatar(token);

    fetchTournaments();
    fetchHotSlots();

  } catch (err) {
    console.error(err);
    await signOut(auth);
    location.href = "index.html";
  }
});

/* =========================
   LOAD AVATAR
========================= */
async function loadUserAvatar(token) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;

    const data = await res.json();
    setAvatarUI(data?.user?.avatar || "a1");
  } catch {}
}

function setAvatarUI(code) {
  const src = `assets/avatars/${code}.png`;
  if (headerAvatar) headerAvatar.src = src;
  if (sidebarAvatar) sidebarAvatar.src = src;
}

/* =========================
   FETCH TOURNAMENTS
========================= */
async function fetchTournaments() {
  try {
    const [ongoing, upcoming, past] = await Promise.all([
      fetch(`${BACKEND_URL}/tournaments/public/ongoing`).then(r => r.json()),
      fetch(`${BACKEND_URL}/tournaments/public/upcoming`).then(r => r.json()),
      fetch(`${BACKEND_URL}/tournaments/public/past`).then(r => r.json())
    ]);

    render("ongoing", normalize(ongoing));
    render("upcoming", normalize(upcoming), true);
    render("past", normalize(past));
  } catch (err) {
    console.error("Fetch error", err);
  }
}

function normalize(d) {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.tournaments)) return d.tournaments;
  return [];
}

/* =========================
   RENDER TOURNAMENTS
========================= */
function render(id, list, joinable = false) {
  const div = document.getElementById(id);
  div.innerHTML = list.length
    ? list.map(t => `
        <div class="card">
          <h4>${t.name}</h4>
          <p>Slots: ${t.players?.length || 0}/${t.slots}</p>
          <p>Prize: ₹${t.prizePool}</p>
          <p>Entry: ${t.entryType}</p>
          ${
            joinable
              ? `<button onclick="joinTournament('${t._id}')">Join</button>`
              : ""
          }
        </div>
      `).join("")
    : "<p>No tournaments found</p>";
}

/* =========================
   JOIN TOURNAMENT 🔥
========================= */
window.joinTournament = async (id) => {
  try {
    const token = await getIdToken(auth.currentUser);

    const res = await fetch(`${BACKEND_URL}/tournaments/join/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || "Join failed");
      return;
    }

    // Paid tournament response
    if (data.payment) {
      alert(
        `Paid Tournament\n\nEntry Fee: ₹${data.payment.entryFee}\nUPI: ${data.payment.upiId}`
      );
      return;
    }

    alert("Successfully joined tournament ✅");
    fetchTournaments();

  } catch (err) {
    alert("Server error");
  }
};

/* =========================
   HOT SLOTS (UNCHANGED)
========================= */
async function fetchHotSlots() {
  try {
    const res = await fetch(`${BACKEND_URL}/hot-slots`);
    const data = await res.json();
    const div = document.getElementById("hot");

    div.innerHTML = Array.isArray(data) && data.length
      ? data.map(s => `
          <div class="card hot-slot">
            <h4>${s.tournament}</h4>
            <p>Prize: ₹${s.prizePool}</p>
            <a href="https://wa.me/91${s.contact}" target="_blank">Contact</a>
          </div>
        `).join("")
      : "No hot slots available";
  } catch {}
}

/* =========================
   LOGOUT
========================= */
document.getElementById("logout").onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};
