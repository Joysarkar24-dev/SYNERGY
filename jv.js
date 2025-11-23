// ========== MODAL HANDLING ==========
const overlay = document.getElementById('overlay');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');

function openModal(modal) {
  overlay.classList.add('active');
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modal) {
  overlay.classList.remove('active');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

document.getElementById('openLogin').addEventListener('click', () => openModal(loginModal));
document.getElementById('openSignup').addEventListener('click', () => openModal(signupModal));
document.getElementById('overlay').addEventListener('click', () => {
  closeModal(loginModal);
  closeModal(signupModal);
});

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-close');
    closeModal(document.getElementById(modalId));
  });
});

// Switch between signup/login modals
document.getElementById('openLoginFromSignup').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal(signupModal);
  openModal(loginModal);
});
document.getElementById('openSignupFromLogin').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal(loginModal);
  openModal(signupModal);
});

// ========== SIMPLE USER LOGIN SYSTEM ==========
const authErrorLogin = document.getElementById('loginError');
const authErrorSignup = document.getElementById('signupError');
const userPreview = document.getElementById('userPreview');
const userNamePreview = document.getElementById('userNamePreview');
const userPhoto = document.getElementById('userPhoto');
const authButtonsArea = document.getElementById('authButtonsArea');
const logoutBtn = document.getElementById('logoutBtn');

function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUser(user) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem('users', JSON.stringify(users));
}

// Signup form
document.getElementById('signupForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const phone = document.getElementById('signupPhone').value.trim();
  if (!name || !email || !password) {
    authErrorSignup.textContent = 'All fields are required!';
    return;
  }
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    authErrorSignup.textContent = 'Email already registered!';
    return;
  }
  saveUser({ name, email, password, phone });
  localStorage.setItem('currentUser', JSON.stringify({ name, email }));
  updateUI();
  closeModal(signupModal);
});

// Login form
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    authErrorLogin.textContent = 'Invalid email or password';
    return;
  }
  localStorage.setItem('currentUser', JSON.stringify({ name: user.name, email: user.email }));
  updateUI();
  closeModal(loginModal);
});

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  updateUI();
});

// Update UI based on login
function updateUI() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    userPreview.classList.remove('hidden');
    userPreview.setAttribute('aria-hidden', 'false');
    userNamePreview.textContent = currentUser.name;
    authButtonsArea.querySelectorAll('button:not(#logoutBtn)').forEach(b => b.style.display = 'none');
  } else {
    userPreview.classList.add('hidden');
    userPreview.setAttribute('aria-hidden', 'true');
    authButtonsArea.querySelectorAll('button:not(#logoutBtn)').forEach(b => b.style.display = 'inline-block');
  }
}
updateUI();

// ========== HABIT STREAK LOGIC ==========
const streakDisplay = document.getElementById('streakDisplay');
const completeDayBtn = document.getElementById('completeDay');

function loadStreak() {
  const streakData = JSON.parse(localStorage.getItem('streak')) || { count: 0, lastDate: null };
  return streakData;
}

function saveStreak(data) {
  localStorage.setItem('streak', JSON.stringify(data));
}

function updateStreakDisplay() {
  const streakData = loadStreak();
  streakDisplay.textContent = `Streak: ${streakData.count} day${streakData.count !== 1 ? 's' : ''}`;
}

completeDayBtn.addEventListener('click', () => {
  const today = new Date().toDateString();
  const streakData = loadStreak();
  if (streakData.lastDate === today) return; // already completed today
  // Check if yesterday was completed for continuous streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  if (streakData.lastDate === yesterdayStr) {
    streakData.count += 1;
  } else {
    streakData.count = 1; // reset if a day was skipped
  }
  streakData.lastDate = today;
  saveStreak(streakData);
  updateStreakDisplay();
});
updateStreakDisplay();

// ================= SIMPLE ROUTINE PLACEHOLDER =================
const routineContainer = document.getElementById('routineContainer');
const sampleRoutines = [
  { day: 'Monday', workout: 'Chest & Triceps' },
  { day: 'Tuesday', workout: 'Back & Biceps' },
  { day: 'Wednesday', workout: 'Legs & Abs' },
  { day: 'Thursday', workout: 'Shoulders & Cardio' },
  { day: 'Friday', workout: 'Full Body' },
  { day: 'Saturday', workout: 'Stretch & Mobility' },
  { day: 'Sunday', workout: 'Rest Day' }
];

function renderRoutines() {
  routineContainer.innerHTML = '';
  sampleRoutines.forEach(r => {
    const card = document.createElement('div');
    card.classList.add('feature-card');
    card.innerHTML = `<h4>${r.day}</h4><p>${r.workout}</p>`;
    routineContainer.appendChild(card);
  });
}
renderRoutines();
