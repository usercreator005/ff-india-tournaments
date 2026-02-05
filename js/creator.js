// js/creator.js

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
   DOM REFERENCES
========================= */
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("creatorSidebar");
const overlay = document.getElementById("creatorOverlay");
const logoutBtn = document.getElementById("logoutBtn");

const creatorName = document.getElementById("creatorName");
const creatorEmail = document.getElementById("creatorEmail");

/* =========================
   SIDEBAR STATE
========================= */
let sidebarOpen = false;

/* =========================
   SIDEBAR CONTROLS
========================= */
function openSidebar() {
  if (!sidebar || !overlay) return;
  sidebar.classList.remove("hidden");
  overlay.classList.remove("hidden");
  sidebarOpen = true;
}

function closeSidebar() {
  if (!sidebar || !overlay) return;
  sidebar.classList.add("hidden");
  overlay.classList.add("hidden");
  sidebarOpen = false;
}

function toggleSidebar(e) {
  e.stopPropagation(); // 🔥 MOST IMPORTANT FIX
  sidebarOpen ? closeSidebar() : openSidebar();
}

/* =========================
   EVENT LISTENERS
========================= */
avatar?.addEventListener("click", toggleSidebar);

// overlay click → close
overlay?.addEventListener("click", () => {
  if (sidebarOpen) closeSidebar();
});

// sidebar ke andar click → close na ho
sidebar?.addEventListener("click", (e) => {
  e.stopPropagation();
});

// ESC key support
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sidebarOpen) closeSidebar();
});

/* =========================
   LOGOUT (SIDEBAR)
========================= */
logoutBtn?.addEventListener("click", async (e) => {
  e.stopPropagation();
  if (!confirm("Logout from Creator Panel?")) return;
  await signOut(auth);
  window.location.href = "index.html";
});

/* =========================
   ROLE SWITCH
========================= */
document.getElementById("switchUser")?.addEventListener("click", () => {
  window.location.href = "user.html";
});

document.getElementById("switchAdmin")?.addEventListener("click", () => {
  window.location.href = "admin.html";
});

/* =========================
   CREATOR AUTH GUARD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    creatorName.innerText = user.displayName || "Creator";
    creatorEmail.innerText = user.email || "";

    const token = await getIdToken(user, true);

    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Role check failed");

    const data = await res.json();

    if (data.role !== "creator") {
      alert("Unauthorized access");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    fetchStats(token);
    fetchAdmins(token);
    fetchMyHotSlots(token);

  } catch (err) {
    console.error("Creator auth error:", err);
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
   HOT SLOT UI HELPERS
========================= */
const contactInput = document.getElementById("contactNumber");
const dmNumber = document.getElementById("dmNumber");

contactInput?.addEventListener("input", () => {
  dmNumber.innerText = contactInput.value || "Not Set";
});

dmNumber?.addEventListener("click", () => {
  const num = contactInput.value;
  if (num.length === 10) {
    window.open(`https://wa.me/91${num}`, "_blank");
  }
});

/* =========================
   POST HOT SLOT
========================= */
document.getElementById("postSlot")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const tournamentName = document.getElementById("slotTournament").value.trim();
  const prizePool = document.getElementById("slotPrize").value.trim();
  const stage = document.getElementById("slotStage").value.trim();
  const description = document.getElementById("slotDetails").value.trim();
  const contact = contactInput.value.trim();

  if (!tournamentName || !stage || !description || contact.length !== 10) {
    alert("Please fill all hot slot fields correctly");
    return;
  }

  try {
    const token = await getIdToken(user);

    const res = await fetch(`${BACKEND_URL}/creator/hot-slot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        tournamentName,
        prizePool,
        stage,
        description,
        contact
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || "Failed to post hot slot");
      return;
    }

    alert("Hot Slot posted successfully");

    document.getElementById("slotTournament").value = "";
    document.getElementById("slotPrize").value = "";
    document.getElementById("slotStage").value = "";
    document.getElementById("slotDetails").value = "";
    contactInput.value = "";
    dmNumber.innerText = "Not Set";

    fetchMyHotSlots(token);

  } catch (err) {
    console.error("Hot slot error:", err);
    alert("Server error while posting hot slot");
  }
});

/* =========================
   FETCH ADMINS
========================= */
async function fetchAdmins(token) {
  const res = await fetch(`${BACKEND_URL}/creator/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return;

  const data = await res.json();
  const list = document.getElementById("adminList");
  list.innerHTML = "";

  (data.admins || []).forEach((admin) => {
    const li = document.createElement("li");
    li.textContent = `${admin.email} ❌`;

    li.onclick = async () => {
      if (!confirm(`Remove admin ${admin.email}?`)) return;
      await fetch(`${BACKEND_URL}/creator/remove-admin/${admin.email}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdmins(token);
    };

    list.appendChild(li);
  });
}

/* =========================
   FETCH MY HOT SLOTS
========================= */
async function fetchMyHotSlots(token) {
  const res = await fetch(`${BACKEND_URL}/creator/hot-slots`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return;

  const data = await res.json();
  const slots = data.slots || [];

  const list = document.getElementById("hotSlotList");
  const empty = document.getElementById("hotSlotEmpty");

  list.innerHTML = "";

  if (slots.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  slots.forEach((slot) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${slot.title || slot.tournamentName}</strong><br>
        Stage: ${slot.stage}<br>
        Prize: ${slot.prizePool}<br>
        ${slot.expired ? "⛔ Expired" : "✅ Active"}
      </div>
    `;
    list.appendChild(li);
  });
}

/* =========================
   FETCH STATS
========================= */
async function fetchStats(token) {
  const res = await fetch(`${BACKEND_URL}/creator/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return;

  const data = await res.json();
  document.getElementById("totalUsers").innerText = data.totalUsers || 0;
  document.getElementById("activeTournaments").innerText = data.activeHotSlots || 0;
  document.getElementById("totalAdmins").innerText = data.admins?.length || 0;
}
