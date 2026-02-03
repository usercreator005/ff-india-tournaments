

// js/user.js
// PHASE 3 – USER DASHBOARD + AVATAR SYNC (LOCKED)

// Firebase Auth
import { auth } from "./firebase.js";
import {
onAuthStateChanged,
signOut,
getIdToken
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const BACKEND_URL = "https://ff-india-tournaments.onrender.com";

/* =========================
ELEMENTS (SAFE SELECT)
========================= */
const sidebar = document.getElementById("sidebar");
const headerAvatar = document.getElementById("headerAvatar");
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");

const bell = document.getElementById("notificationBell");
const panel = document.getElementById("notificationPanel");

/* =========================
AUTH GUARD + INIT
========================= */
onAuthStateChanged(auth, async (user) => {
if (!user) {
window.location.href = "index.html";
return;
}

try {
const token = await getIdToken(user);

const roleRes = await fetch(`${BACKEND_URL}/auth/role`, {  
  headers: { Authorization: `Bearer ${token}` }  
});  

const roleData = await roleRes.json();  
if (roleData.role !== "user") throw new Error("Not user");  

sidebarUserName.innerText = user.displayName || "Player";  

await loadUserAvatar(token);  

fetchTournaments();  
fetchHotSlots();

} catch (err) {
console.error("Auth error:", err);
await signOut(auth);
window.location.href = "index.html";
}
});

/* =========================
LOAD USER AVATAR
========================= */
async function loadUserAvatar(token) {
try {
const res = await fetch(${BACKEND_URL}/auth/me, {
headers: { Authorization: Bearer ${token} }
});

if (!res.ok) return;  

const data = await res.json();  
const avatarCode = data?.user?.avatar || "a1";  
setAvatarUI(avatarCode);

} catch (err) {
console.error("Avatar load error:", err);
}
}

/* =========================
AVATAR UI SYNC
========================= */
function setAvatarUI(code) {
const path = assets/avatars/${code}.png;
if (headerAvatar) headerAvatar.src = path;
if (sidebarAvatar) sidebarAvatar.src = path;
}

/* =========================
SIDEBAR & NOTIFICATION TOGGLE
========================= */
if (headerAvatar) {
headerAvatar.addEventListener("click", (e) => {
e.stopPropagation();
sidebar.classList.toggle("active");
panel.classList.remove("active");
});
}

if (bell) {
bell.addEventListener("click", (e) => {
e.stopPropagation();
panel.classList.toggle("active");
sidebar.classList.remove("active");
});
}

sidebar.addEventListener("click", e => e.stopPropagation());
panel.addEventListener("click", e => e.stopPropagation());

document.addEventListener("click", () => {
sidebar.classList.remove("active");
panel.classList.remove("active");
});

/* =========================
SIDEBAR NAVIGATION
========================= */
document.getElementById("userInfoBtn").onclick = () => {
window.location.href = "user-info.html";
};

document.getElementById("teamBtn").onclick = () => {
window.location.href = "team.html";
};

document.getElementById("myTournamentsBtn").onclick = () => {
window.location.href = "my-tournaments.html";
};

document.getElementById("supportBtn").onclick = () => {
window.open("https://wa.me/919981977828", "_blank");
};

/* =========================
LOGOUT
========================= */
document.getElementById("logout").onclick = async () => {
await signOut(auth);
window.location.href = "index.html";
};

/* =========================
DASHBOARD TABS
========================= */
document.querySelectorAll(".tab-btn").forEach(btn => {
btn.onclick = () => {
document.querySelectorAll(".tab-btn").forEach(b =>
b.classList.remove("active")
);
document.querySelectorAll(".tab").forEach(t =>
t.classList.remove("active")
);

btn.classList.add("active");  
document.getElementById(btn.dataset.tab).classList.add("active");  

if (btn.dataset.tab === "hot") clearHotBadge();

};
});

/* =========================
FETCH TOURNAMENTS ✅ FIXED
========================= */
async function fetchTournaments() {
try {
const [o, u, p] = await Promise.all([
fetch(${BACKEND_URL}/tournaments/public/ongoing).then(r => r.json()),
fetch(${BACKEND_URL}/tournaments/public/upcoming).then(r => r.json()),
fetch(${BACKEND_URL}/tournaments/public/past).then(r => r.json())
]);

renderTournaments("ongoing", normalize(o));  
renderTournaments("upcoming", normalize(u));  
renderTournaments("past", normalize(p));

} catch (err) {
console.error("Tournament fetch error:", err);
}
}

/* 🔥 BACKEND RESPONSE NORMALIZER */
function normalize(d) {
if (Array.isArray(d)) return d;
if (Array.isArray(d?.tournaments)) return d.tournaments;
return [];
}

function renderTournaments(id, list) {
const div = document.getElementById(id);
div.innerHTML = list.length
? list.map(t =>   <div class="card">   <h4>${t.name}</h4>   <p>Slots: ${t.slots}</p>   <p>Prize: ₹${t.prizePool}</p>   </div>  ).join("")
: "<p>No tournaments found</p>";
}

/* =========================
HOT SLOTS
========================= */
async function fetchHotSlots() {
try {
const res = await fetch(${BACKEND_URL}/hot-slots);
const data = await res.json();
const slots = Array.isArray(data) ? data : [];

const div = document.getElementById("hot");  
const badge = document.getElementById("hotBadge");  

if (!slots.length) {  
  div.innerHTML = "No hot slots available";  
  badge.style.display = "none";  
  return;  
}  

const last = Number(localStorage.getItem("hotSlotCount") || 0);  
if (slots.length > last) {  
  badge.innerText = slots.length - last;  
  badge.style.display = "inline-block";  
}  

div.innerHTML = slots.map(s => `  
  <div class="card hot-slot">  
    <h4>${s.tournament}</h4>  
    <p>Prize: ₹${s.prizePool}</p>  
    <a href="https://wa.me/91${s.contact}" target="_blank">Contact</a>  
  </div>  
`).join("");

} catch (err) {
console.error("Hot slot error:", err);
}
}

function clearHotBadge() {
document.getElementById("hotBadge").style.display = "none";
fetch(${BACKEND_URL}/hot-slots)
.then(r => r.json())
.then(d =>
localStorage.setItem("hotSlotCount", Array.isArray(d) ? d.length : 0)
);
                                              }
