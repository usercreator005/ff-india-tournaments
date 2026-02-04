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
      headers: {
        Authorization: `Bearer ${token}`
      }
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
    console.error("Creator auth error:", err);
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
   LOGOUT (AVATAR CLICK)
========================= */
const avatar = document.getElementById("avatar");

avatar?.addEventListener("click", async () => {
  const ok = confirm("Logout from Creator Panel?");
  if (!ok) return;

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
  const num = contactInput.value;
  if (!num || num.length !== 10) return;
  window.open(`https://wa.me/91${num}`, "_blank");
});

/* =========================
   POST HOT SLOT (CREATOR)
   NOTE: Promo only (not tied to site tournaments)
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

  if (
    !tournament ||
    !prizePool ||
    !stage ||
    !details ||
    contact.length !== 10
  ) {
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
        tournament,     // promo name
        prizePool,      // text
        stage,
        slots: details, // promo details (backend model will be aligned later)
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

  } catch (err) {
    console.error("Hot slot error:", err);
    alert("Server error while posting hot slot");
  }
});

/* =========================
   CREATE ADMIN (CREATOR ONLY)
========================= */
const addAdminBtn = document.getElementById("addAdmin");

addAdminBtn?.addEventListener("click", async () => {
  const name = document.getElementById("adminName").value.trim();
  const email = document.getElementById("adminEmail").value.trim();

  if (!name || !email) {
    alert("Enter admin name and email");
    return;
  }

  try {
    const token = await getIdToken(auth.currentUser);

    const res = await fetch(`${BACKEND_URL}/creator/create-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, email })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || "Admin creation failed");
      return;
    }

    alert("Admin created successfully");

    document.getElementById("adminName").value = "";
    document.getElementById("adminEmail").value = "";

    fetchAdmins(token);

  } catch (err) {
    console.error("Create admin error:", err);
    alert("Server error");
  }
});

/* =========================
   FETCH ADMINS (FROM STATS)
========================= */
async function fetchAdmins(token) {
  try {
    const res = await fetch(`${BACKEND_URL}/creator/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return;

    const data = await res.json();
    const admins = data.admins || [];

    const list = document.getElementById("adminList");
    list.innerHTML = "";

    admins.forEach((admin) => {
      const li = document.createElement("li");
      li.textContent = `${admin.email} ❌`;

      li.addEventListener("click", async () => {
        const ok = confirm(`Remove admin ${admin.email}?`);
        if (!ok) return;

        const del = await fetch(
          `${BACKEND_URL}/creator/remove-admin/${admin.email}`,
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
    console.error("Fetch admins error:", err);
  }
}

/* =========================
   FETCH CREATOR STATS
========================= */
async function fetchStats(token) {
  try {
    const res = await fetch(`${BACKEND_URL}/creator/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return;

    const data = await res.json();

    document.getElementById("totalUsers").innerText =
      data.totalUsers || 0;

    document.getElementById("activeTournaments").innerText =
      data.activeTournaments || 0;

    document.getElementById("totalAdmins").innerText =
      data.admins ? data.admins.length : 0;

  } catch (err) {
    console.error("Stats fetch error:", err);
  }
}
