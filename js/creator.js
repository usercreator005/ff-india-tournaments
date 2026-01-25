// Auth Guard + Creator lock
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    console.log("Creator logged in:", creator.email);
  }
});
// Dummy stats (backend phase me real)
document.getElementById("totalUsers").innerText = 128;
document.getElementById("activeTournaments").innerText = 4;
document.getElementById("totalAdmins").innerText = 2;

// Testing switches
document.getElementById("loginUser").onclick=()=>{
  window.location.href="user.html";
};

document.getElementById("loginAdmin").onclick=()=>{
  window.location.href="admin.html";
};

// Hot slot WhatsApp logic
const numberInput=document.getElementById("contactNumber");
const dmNumber=document.getElementById("dmNumber");

numberInput.oninput=()=>{
  dmNumber.innerText = numberInput.value;
};

dmNumber.onclick=()=>{
  const num = numberInput.value;
  if(num){
    window.open(`https://wa.me/91${num}?text=DM%20ME%20FOR%20DETAILS%20-%20${num}`);
  }
};
