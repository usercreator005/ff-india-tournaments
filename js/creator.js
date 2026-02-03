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
    const token = await getIdToken(user);
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

    console.log("Creator verified:", data.email);

    fetchStats(token);
    fetchAdmins(token);

  } catch (err) {
    console.error(err);
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
   LOGOUT / AVATAR
========================= */
const avatar = document.getElementById("avatar");
if (avatar) {
  avatar.addEventListener("click", async () => {
    const confirmLogout = confirm("Logout from Creator panel?");
    if (!confirmLogout) return;
    await signOut(auth);
    window.location.href = "index.html";
  });
}

/* =========================
   HOT SLOT UI
========================= */
const contactInput = document.getElementById("contactNumber");
const dmNumber = document.getElementById("dmNumber");

if (contactInput) {
  contactInput.addEventListener("input", () => {
    dmNumber.innerText = contactInput.value || "Not Set";
  });
}

dmNumber?.addEventListener("click", () => {
  const num = contactInput.value;
  if (!num || num.length !== 10) return;
  window.open(`https://wa.me/91${num}`, "_blank");
});

/* =========================
   POST HOT SLOT
========================= */
const postBtn = document.getElementById("postSlot");

postBtn?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const tournament = document.getElementById("slotTournament").value.trim();
  const prizePool = document.getElementById("slotPrize").value.trim();
  const stage = document.getElementById("slotStage").value.trim();
  const details = document.getElementById("slotDetails").value.trim();
  const contact = contactInput.value.trim();

  if (!tournament || !prizePool || !stage || !details || contact.length !== 10) {
    alert("Fill all hot slot fields correctly");
    return;
  }

  const token = await getIdToken(user);

  try {
    const res = await fetch(`${BACKEND_URL}/creator/hot-slot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        tournament,
        prizePool,
        stage,
        slots: details,
        contact
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    alert("Hot Slot posted successfully");

    document.getElementById("slotTournament").value = "";
    document.getElementById("slotPrize").value = "";
    document.getElementById("slotStage").value = "";
    document.getElementById("slotDetails").value = "";
    contactInput.value = "";
    dmNumber.innerText = "Not Set";

  } catch (err) {
    console.error(err);
    alert("Failed to post hot slot");
  }
});

/* =========================
   CREATE ADMIN
========================= */
const addAdminBtn = document.getElementById("addAdmin");

addAdminBtn?.addEventListener("click", async () => {
  const name = document.getElementById("adminName").value.trim();
  const email = document.getElementById("adminEmail").value.trim();

  if (!name || !email) {
    alert("Enter admin name & email");
    return;
  }

  const token = await getIdToken(auth.currentUser);

  try {
    const res = await fetch(`${BACKEND_URL}/creator/create-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, email })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    alert("Admin created");
    document.getElementById("adminName").value = "";
    document.getElementById("adminEmail").value = "";
    fetchAdmins(token);

  } catch (err) {
    console.error(err);
    alert("Admin creation failed");
  }
});

/* =========================
   FETCH ADMINS
========================= */
async function fetchAdmins(token) {
  try {
    const res = await fetch(`${BACKEND_URL}/creator/admins`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return;

    const admins = await res.json();
    const list = document.getElementById("adminList");
    list.innerHTML = "";

    admins.forEach((a) => {
      const li = document.createElement("li");
      li.textContent = a.email + " ❌";

      li.addEventListener("click", async () => {
        if (!confirm(`Remove admin ${a.email}?`)) return;

        const del = await fetch(
          `${BACKEND_URL}/creator/remove-admin/${a.email}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (del.ok) fetchAdmins(token);
        else alert("Failed to remove admin");
      });

      list.appendChild(li);
    });

  } catch (err) {
    console.error("Fetch admins failed", err);
  }
}

/* =========================
   FETCH STATS
========================= */
async function fetchStats(token) {
  try {
    const res = await fetch(`${BACKEND_URL}/creator/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return;

    const data = await res.json();

    document.getElementById("totalUsers").innerText = data.totalUsers || 0;
    document.getElementById("activeTournaments").innerText =
      data.activeTournaments || 0;
    document.getElementById("totalAdmins").innerText =
      data.totalAdmins || 0;

  } catch (err) {
    console.error("Stats fetch error", err);
  }
    }
