// Auth Guard
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// Sidebar toggle
const avatar = document.getElementById("avatar");
const sidebar = document.getElementById("sidebar");
avatar.onclick = () => sidebar.classList.toggle("active");

// Logout
document.getElementById("logout").onclick = () => {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  });
};

// Tabs
const tabBtns = document.querySelectorAll(".tab-btn");
const tabs = document.querySelectorAll(".tab");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    tabs.forEach(t => t.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Notification panel
const bell = document.getElementById("notificationBell");
const panel = document.getElementById("notificationPanel");

bell.onclick = () => {
  panel.classList.toggle("active");
};
