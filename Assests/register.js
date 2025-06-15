document.getElementById('registerForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const email = e.target[0].value.trim();
  const password = e.target[1].value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Registration successful!");
      window.location.href = "index.html"; // Redirect to homepage
    })
    .catch(error => {
      console.error("Registration Error:", error);
      alert("Error: " + error.message);
    });
});
