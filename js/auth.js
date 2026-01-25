const googleBtn = document.getElementById("googleLoginBtn");

googleBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      console.log("Logged in:", user.email);

      // TEMP ROLE LOGIC (Phase 1)
      if (user.email === "jarahul989@gmail.com") {
        window.location.href = "creator.html";
      } else {
        // default user
        window.location.href = "user.html";
      }
    })
    .catch(err => {
      alert(err.message);
    });
});
