// js/creator.js

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
   CREATOR AUTH GUARD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
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
    fetchHotSlots(token); // ✅ NEW

  } catch (err) {
    console.error("Creator auth error:", err);
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
   LOGOUT
========================= */
document.getElementById("avatar")?.addEventListener("click", async () => {
  if (!confirm("Logout from Creator Panel?")) return;
  await signOut(auth);
  window.location.href = "index.html";
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
  const num = contactInput.value.trim();
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
        prizePool: prizePool || 0,
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

    alert("Hot Slot posted");

    fetchHotSlots(token); // ✅ refresh list

    document.getElementById("slotTournament").value = "";
    document.getElementById("slotPrize").value = "";
    document.getElementById("slotStage").value = "";
    document.getElementById("slotDetails").value = "";
    contactInput.value = "";
    dmNumber.innerText = "Not Set";

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});

/* =========================
   FETCH HOT SLOTS (NEW)
========================= */
async function fetchHotSlots(token) {
  const res = await fetch(`${BACKEND_URL}/creator/hot-slots`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return;

  const data = await res.json();
  const list = document.getElementById("hotSlotList");
  if (!list) return;

  list.innerHTML = "";

  (data.slots || []).forEach((slot) => {
    const div = document.createElement("div");
    div.className = "hot-slot-item";

    div.innerHTML = `
      <h4>${slot.tournamentName}</h4>
      <p>Stage: ${slot.stage}</p>
      <p>Prize: ₹${slot.prizePool}</p>
      <p>${slot.description}</p>
      <small>📞 ${slot.contact}</small>
      <button class="delete-slot">Delete</button>
    `;

    div.querySelector(".delete-slot").onclick = async () => {
      if (!confirm("Delete this hot slot?")) return;

      await fetch(`${BACKEND_URL}/creator/hot-slot/${slot._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchHotSlots(token);
    };

    list.appendChild(div);
  });
}

/* =========================
   CREATE ADMIN
========================= */
document.getElementById("addAdmin")?.addEventListener("click", async () => {
  const name = document.getElementById("adminName").value.trim();
  const email = document.getElementById("adminEmail").value.trim();

  if (!name || !email) return alert("Enter admin details");

  const token = await getIdToken(auth.currentUser);

  await fetch(`${BACKEND_URL}/creator/create-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, email })
  });

  document.getElementById("adminName").value = "";
  document.getElementById("adminEmail").value = "";

  fetchAdmins(token);
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
      if (!confirm(`Remove ${admin.email}?`)) return;

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
   FETCH STATS
========================= */
async function fetchStats(token) {
  const res = await fetch(`${BACKEND_URL}/creator/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return;

  const data = await res.json();

  document.getElementById("totalUsers").innerText = data.totalUsers || 0;
  document.getElementById("activeTournaments").innerText = data.activeTournaments || 0;
  document.getElementById("totalAdmins").innerText = data.admins?.length || 0;
                               }
