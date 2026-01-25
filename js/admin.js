// Auth Guard
firebase.auth().onAuthStateChanged(user=>{
  if(!user){
    window.location.href="index.html";
  }
});

// Sidebar
const avatar=document.getElementById("avatar");
const sidebar=document.getElementById("sidebar");
avatar.onclick=()=>sidebar.classList.toggle("active");

// Notifications
const bell=document.getElementById("bell");
const panel=document.getElementById("notificationPanel");
bell.onclick=()=>panel.classList.toggle("active");

// Logout
document.getElementById("logout").onclick=()=>{
  firebase.auth().signOut().then(()=>{
    window.location.href="index.html";
  });
};

// Toggle forms
const btnCreate=document.getElementById("btnCreate");
const btnManage=document.getElementById("btnManage");
const createForm=document.getElementById("createForm");
const manageSection=document.getElementById("manageSection");

btnCreate.onclick=()=>{
  createForm.classList.remove("hidden");
  manageSection.classList.add("hidden");
};

btnManage.onclick=()=>{
  manageSection.classList.remove("hidden");
  createForm.classList.add("hidden");
};

// Entry fee conditional
const entryType=document.getElementById("entryType");
const entryFee=document.getElementById("entryFee");

entryType.onchange=()=>{
  if(entryType.value==="paid"){
    entryFee.classList.remove("hidden");
  }else{
    entryFee.classList.add("hidden");
  }
};
