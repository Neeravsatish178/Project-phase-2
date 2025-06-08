
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginForm.querySelector('input[type="email"]').value.trim();
    const password = loginForm.querySelector('input[type="password"]').value;

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    try {
      // Sign in with Firebase Authentication
      await firebase.auth().signInWithEmailAndPassword(email, password);
      
      // Redirect to homepage on successful login
      window.location.href = 'index.html';
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  });
});
