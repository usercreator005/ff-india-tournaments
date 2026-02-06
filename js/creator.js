<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Creator Dashboard | FF INDIA TOURNAMENTS</title>

  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Creator Control Panel – FF India Tournaments" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />

  <!-- Creator CSS -->
  <link rel="stylesheet" href="css/creator.css" />
</head>

<body>

<!-- ================= HEADER ================= -->
<header class="header">
  <div class="logo">FF INDIA TOURNAMENTS</div>

  <div class="icons">
    <img
      src="assets/default-avatar.png"
      id="avatar"
      alt="Creator Avatar"
      title="Open Profile"
    />
  </div>
</header>

<!-- ================= MAIN ================= -->
<main class="main">

  <!-- ===== STATS ===== -->
  <section class="stats">
    <div class="card">
      👥 Total Users<br />
      <span id="totalUsers">0</span>
    </div>

    <div class="card">
      🏆 Active Tournaments<br />
      <span id="activeTournaments">0</span>
    </div>

    <div class="card">
      🛡️ Total Admins<br />
      <span id="totalAdmins">0</span>
    </div>
  </section>

  <!-- ===== ADMIN MANAGEMENT ===== -->
  <section class="card full">
    <h3>Admin Management</h3>

    <input type="text" id="adminName" placeholder="Admin Username" />
    <input type="email" id="adminEmail" placeholder="Admin Gmail (Google Login Only)" />

    <button id="addAdmin">➕ Create Admin</button>

    <ul class="admin-list" id="adminList"></ul>
  </section>

  <!-- ===== HOT SLOT POST ===== -->
  <section class="card full">
    <h3>🔥 Post New Hot Slot</h3>

    <input type="text" id="slotTournament" placeholder="Tournament Name" />
    <input type="text" id="slotPrize" placeholder="Prize Pool (e.g. ₹5,000)" />
    <input type="text" id="slotStage" placeholder="Stage (Qualifiers / Finals)" />

    <textarea id="slotDetails" placeholder="Slot Details (Room ID, Time, Rules, etc.)"></textarea>

    <input type="tel" id="contactNumber" placeholder="Contact Number (10 digit)" maxlength="10" />

    <button id="postSlot">🚀 Post Hot Slot</button>

    <p class="dm-text">
      DM ME FOR DETAILS :
      <span id="dmNumber">Not Set</span>
    </p>
  </section>

  <!-- ===== MANAGE HOT SLOTS ===== -->
  <section class="card full">
    <h3>📋 My Posted Hot Slots</h3>

    <div id="hotSlotEmpty" class="dm-text hidden">
      No hot slots posted yet.
    </div>

    <ul class="admin-list" id="hotSlotList"></ul>
  </section>

</main>

<!-- ================= SIDEBAR ================= -->
<div class="creator-overlay hidden" id="creatorOverlay"></div>

<aside class="creator-sidebar hidden" id="creatorSidebar">
  <div class="creator-sidebar-header">
    <img src="assets/default-avatar.png" alt="Creator" />
    <div>
      <strong id="creatorName">Creator</strong><br />
      <small id="creatorEmail">creator@gmail.com</small>
    </div>
  </div>

  <div class="creator-sidebar-footer">
    <button class="creator-logout-btn" id="logoutBtn">
      🚪 Logout
    </button>
  </div>
</aside>

<!-- ================= FOOTER ================= -->
<footer class="footer">
  © 2026 FF INDIA TOURNAMENTS • Creator Panel
</footer>

<!-- ================= SCRIPTS ================= -->
<script type="module" src="js/firebase.js"></script>
<script type="module" src="js/creator.js"></script>

</body>
</html>
