// js/creator.js

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
   CREATOR AUTH GUARD + BACKEND ROLE CHECK
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const token = await getIdToken(user, true);
    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Role verification failed");

    const data = await res.json();

    if (data.role !== "creator") {
      alert("Unauthorized access! You are not a creator.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    console.log("Creator verified:", data.email, data.role);

    // Optional: fetch stats from backend
    fetchStats(token);

    // Optional: fetch existing admins
    fetchAdmins(token);

  } catch (err) {
    console.error(err);
    alert("Authentication failed. Redirecting...");
    await signOut(auth);
    window.location.href = "index.html";
  }
});

/* =========================
   LOGOUT
========================= */
const avatar = document.getElementById("avatar");

avatar.addEventListener("click", () => {
  document.querySelector(".header").classList.toggle("active");
});

const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (err) {
      console.error(err);
      alert("Logout failed");
    }
  });
}

/* =========================
   HOT SLOT POST
========================= */
const numberInput = document.getElementById("contactNumber");
const dmNumber = document.getElementById("dmNumber");

numberInput.addEventListener("input", () => {
  dmNumber.innerText = numberInput.value || "—";
});

dmNumber.addEventListener("click", async () => {
  const num = numberInput.value;
  if (!num) return;

  window.open(
    `https://wa.me/91${num}?text=DM%20ME%20FOR%20DETAILS%20-%20${num}`,
    "_blank"
  );
});

// Post hot slot to backend
const postBtn = document.getElementById("postSlot");
postBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  const token = await getIdToken(user);

  const slotData = {
    tournament: document.querySelector('input[placeholder="Tournament Name"]').value,
    prizePool: document.querySelector('input[placeholder="Prize Pool"]').value,
    stage: document.querySelector('input[placeholder="Stage"]').value,
    slots: document.querySelector('textarea').value,
    contact: document.getElementById("contactNumber").value
  };

  try {
    const res = await fetch(`${BACKEND_URL}/creator/hot-slot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(slotData)
    });

    const data = await res.json();

    if (res.ok) {
      alert("Hot slot posted successfully!");
      document.querySelector('input[placeholder="Tournament Name"]').value = "";
      document.querySelector('input[placeholder="Prize Pool"]').value = "";
      document.querySelector('input[placeholder="Stage"]').value = "";
      document.querySelector('textarea').value = "";
      document.getElementById("contactNumber").value = "";
      dmNumber.innerText = "—";
    } else {
      alert("Error: " + (data.msg || data.message));
    }

  } catch (err) {
    console.error(err);
    alert("Failed to post hot slot. Check console.");
  }
});

/* =========================
   CREATE / REMOVE ADMINS
========================= */
const addAdminBtn = document.getElementById("addAdmin");
addAdminBtn.addEventListener("click", async () => {
  const name = document.getElementById("adminName").value.trim();
  const email = document.getElementById("adminEmail").value.trim();

  if (!name || !email) return alert("Fill both fields");

  const token = await getIdToken(auth.currentUser);

  try {
    const res = await fetch(`${BACKEND_URL}/creator/create-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, email })
    });

    const data = await res.json();
    if (res.ok) {
      alert("Admin created successfully!");
      fetchAdmins(token);
      document.getElementById("adminName").value = "";
      document.getElementById("adminEmail").value = "";
    } else {
      alert("Error: " + (data.msg || data.message));
    }

  } catch (err) {
    console.error(err);
    alert("Failed to create admin");
  }
});

// Fetch existing admins
async function fetchAdmins(token) {
  try {
    const res = await fetch(`${BACKEND_URL}/creator/stats`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    const list = document.getElementById("adminList");
    list.innerHTML = "";

    data.admins.forEach(a => {
      const li = document.createElement("li");
      li.textContent = `${a.email} ❌`;
      li.addEventListener("click", async () => {
        const confirmDel = confirm(`Remove admin ${a.email}?`);
        if (!confirmDel) return;

        const delRes = await fetch(`${BACKEND_URL}/creator/remove-admin/${a.email}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (delRes.ok) fetchAdmins(token);
        else alert("Failed to remove admin");
      });
      list.appendChild(li);
    });

  } catch (err) {
    console.error("Fetch admins error:", err);
  }
}

/* =========================
   STATS FETCH
========================= */
async function fetchStats(token) {
  try {
    const res = await fetch(`${BACKEND_URL}/creator/stats`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) return;

    const data = await res.json();
    document.getElementById("totalUsers").innerText = data.totalUsers || 0;
    document.getElementById("activeTournaments").innerText = data.activeTournaments || 0;
    document.getElementById("totalAdmins").innerText = data.admins?.length || 0;

  } catch (err) {
    console.error("Fetch stats error:", err);
  }
    }
