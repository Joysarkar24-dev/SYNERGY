/* ====================================================================
   SYNERGY — script.js (FINAL: animations, sounds, notifications, UX)
==================================================================== */

/* ---------------------------
   Helper / DOM utilities
----------------------------*/
const q = sel => document.querySelector(sel);
const qa = sel => Array.from(document.querySelectorAll(sel));

/* ---------------------------
   Lightweight Toast system (injected)
----------------------------*/
(function createToastContainer() {
  if (q("#synergyToastContainer")) return;
  const t = document.createElement("div");
  t.id = "synergyToastContainer";
  t.setAttribute("aria-live", "polite");
  t.style.position = "fixed";
  t.style.right = "20px";
  t.style.bottom = "20px";
  t.style.zIndex = 9999;
  document.body.appendChild(t);
})();

function showToast(message, duration = 3000) {
  const container = q("#synergyToastContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.className = "synergy-toast";
  el.innerText = message;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add("visible"));
  setTimeout(() => {
    el.classList.remove("visible");
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ---------------------------
   SOUND — small beep using WebAudio
----------------------------*/
const Sound = (() => {
  let ctx = null;
  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }
  function beep(freq = 440, duration = 0.08, type = "sine") {
    try {
      const c = ensure();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.connect(g);
      g.connect(c.destination);
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, c.currentTime + 0.01);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
      o.stop(c.currentTime + duration + 0.02);
    } catch (e) {
      // audio context blocked or not supported
    }
  }
  return { beep };
})();

/* ---------------------------
   RECOMMENDED ROUTINES
----------------------------*/
function generateRoutine() {
  const goals = ["Weight Loss","Muscle Gain","Endurance","Flexibility"];
  const workouts = {
    "Weight Loss":["Burpees","Jumping Jacks","Mountain Climbers","High Knees","Skipping"],
    "Muscle Gain":["Push-ups","Squats","Pull-ups","Deadlifts","Bench Press"],
    "Endurance":["Running","Cycling","Rowing","Jump Rope","Sprints"],
    "Flexibility":["Yoga","Stretching","Pilates","Foam Rolling","Mobility Drills"]
  };

  const container = q("#routineContainer");
  if(!container) return;
  container.innerHTML = "";

  for(let i=0;i<4;i++){
    const goal = goals[Math.floor(Math.random()*goals.length)];
    const exer = workouts[goal].sort(()=>0.5 - Math.random()).slice(0,3);

    const card = document.createElement("div");
    card.className = "routine-card interactive-3d";
    card.innerHTML = `<h4>${goal}</h4><ul>${exer.map(e=>`<li>${e}</li>`).join("")}</ul>`;
    container.appendChild(card);
  }
}
generateRoutine();

/* ---------------------------
   STORAGE KEYS & helpers
----------------------------*/
const KEYS = {
  STREAK: "streak",
  LAST_WORKOUT: "lastWorkout",
  DAILY: "dailyProgress", // single value 0-100
  WEEKLY_OBJ: "weeklyInsights", // object {mon:val,...}
  REMINDER: "reminderTime",
  USER: "synergyUser",
  AUTO: "synergyAuto"
};

function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }
function loadJSON(key) {
  const v = localStorage.getItem(key);
  if (!v) return null;
  try { return JSON.parse(v); } catch(e){ return null; }
}

/* ---------------------------
   HABIT STREAKS (localStorage)
----------------------------*/
let streak = parseInt(localStorage.getItem(KEYS.STREAK)) || 0;
let lastWorkout = localStorage.getItem(KEYS.LAST_WORKOUT) || null;

function updateStreakDisplay(){
  const el = q("#streakDisplay");
  if(el) el.innerText = `Streak: ${streak} day${streak===1?"":"s"}`;
}
updateStreakDisplay();

/* Mark completed (also attached to Mark Completed button) */
function increaseStreak() {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (lastWorkout === today) {
    showToast("You've already completed today — great job 👍");
    Sound.beep(880, 0.05, "triangle");
    return;
  }

  streak = (lastWorkout === yesterday) ? streak + 1 : 1;
  lastWorkout = today;

  localStorage.setItem(KEYS.STREAK, streak);
  localStorage.setItem(KEYS.LAST_WORKOUT, today);
  updateStreakDisplay();

  // feedback
  Sound.beep(660, 0.12, "sine");
  navigator.vibrate?.(120);
  showToast(`Marked complete — streak: ${streak} day${streak===1?"":"s"}`, 3500);
  // small highlight animation
  const el = q("#streakDisplay");
  if (el) {
    el.classList.add("glow");
    setTimeout(() => el.classList.remove("glow"), 900);
  }
}

/* Attach to DOM if button exists (additional safety)
   HTML already calls increaseStreak() via onclick; this is redundant but safe */
q("#completeDay")?.addEventListener("click", increaseStreak);

/* ---------------------------
   DAILY PROGRESS (bar + circle + localStorage)
----------------------------*/
function updateDailyProgress() {
  // ask the user for a percentage (friendly prompt)
  const prev = parseInt(localStorage.getItem(KEYS.DAILY)) || 0;
  const raw = prompt("Enter today's workout completion percentage (0 - 100):", prev);
  if (raw === null) return; // cancelled
  const n = parseInt(raw);
  if (isNaN(n) || n < 0 || n > 100) {
    alert("Please enter a whole number between 0 and 100.");
    return;
  }
  setDailyProgress(n);
}

function setDailyProgress(value) {
  // update bar
  const bar = q("#dailyProgressFill");
  if (bar) {
    bar.style.width = value + "%";
    bar.setAttribute("aria-valuenow", value);
    bar.classList.add("filled");
    setTimeout(() => bar.classList.remove("filled"), 900);
  }

  // update percent text
  const text = q("#dailyPercent");
  if (text) {
    text.innerText = value + "%";
    text.classList.add("pop");
    setTimeout(() => text.classList.remove("pop"), 700);
  }

  // circle gauge
  updateDailyCircleGauge(value);

  // store
  localStorage.setItem(KEYS.DAILY, value);

  // small feedback
  Sound.beep(520 + value, 0.07, "sine");
  navigator.vibrate?.(40);
  showToast("Daily progress updated", 2200);
}

// attempt to restore stored daily progress on load
(function loadDailyFromStorage(){
  const v = parseInt(localStorage.getItem(KEYS.DAILY));
  if (!isNaN(v)) {
    const bar = q("#dailyProgressFill"); if (bar) bar.style.width = v + "%";
    const text = q("#dailyPercent"); if (text) text.innerText = v + "%";
    updateDailyCircleGauge(v);
  }
})();

/* ---------------------------
   WEEKLY PERFORMANCE INSIGHTS (per-day bars + weekly avg gauge)
----------------------------*/
function randomizeWeekly() {
  // create random values for each day; store object for later
  const days = ["mon","tue","wed","thu","fri","sat","sun"];
  const obj = {};
  let total = 0;
  days.forEach(day => {
    const val = Math.floor(Math.random() * 101); // 0-100
    obj[day] = val;
    const el = q("#" + day);
    if (el) {
      el.style.width = val + "%";
      el.classList.add("bar-animate");
      setTimeout(() => el.classList.remove("bar-animate"), 800);
    }
    total += val;
  });
  saveJSON(KEYS.WEEKLY_OBJ, obj);
  const avg = Math.round(total / 7);
  updateWeeklyCircleGauge(avg);
  localStorage.setItem("weeklyAvg", avg);

  Sound.beep(740, 0.06, "square");
  showToast("Weekly insights refreshed", 2000);
}

// restore any stored weeklyInsights on load
(function loadWeeklyFromStorage(){
  const obj = loadJSON(KEYS.WEEKLY_OBJ);
  if (obj) {
    let total = 0, count = 0;
    Object.keys(obj).forEach(day => {
      const v = obj[day];
      const el = q("#" + day);
      if (el) el.style.width = v + "%";
      total += (v||0); count++;
    });
    if (count) {
      const avg = Math.round(total / count);
      updateWeeklyCircleGauge(avg);
      localStorage.setItem("weeklyAvg", avg);
    }
  } else {
    // if nothing stored, compute from weeklyAvg if exists
    const avg = parseInt(localStorage.getItem("weeklyAvg"));
    if (!isNaN(avg)) updateWeeklyCircleGauge(avg);
  }
})();

/* ---------------------------
   ===== CIRCULAR NEON GAUGES =====
   (uses conic-gradient on the .circle elements)
----------------------------*/

function setCircleProgress(id, percent) {
  const circle = q(`#${id}`);
  const text = q(`#${id}Text`);
  if (!circle || !text) return;
  const deg = Math.max(0, Math.min(100, percent)) * 3.6;
  circle.style.background = `conic-gradient(#d400ff ${deg}deg, rgba(30,30,36,0.9) 0deg)`;
  text.innerText = Math.round(percent) + "%";
  circle.classList.add("ring-animate");
  setTimeout(() => circle.classList.remove("ring-animate"), 800);
}

function updateDailyCircleGauge(value){
  setCircleProgress("dailyCircle", value);
}
function updateWeeklyCircleGauge(value){
  setCircleProgress("weeklyCircle", value);
}

/* ---------------------------
   NOTIFICATION / REMINDER scheduling
----------------------------*/
if("Notification" in window && Notification.permission !== "granted"){
  // ask on first interaction friendly — but request now silently
  Notification.requestPermission().catch(()=>{});
}

function scheduleDailyReminder(timeStr){
  if(!timeStr) return;
  if(Notification.permission !== "granted") {
    showToast("Notifications permission not granted — enable to receive reminders.", 4000);
    return;
  }

  // clear old
  if(window._synergyReminderTimeout) clearTimeout(window._synergyReminderTimeout);

  const now = new Date();
  const [hh,mm] = timeStr.split(":").map(Number);
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if(next <= now) next.setDate(next.getDate() + 1);

  const delay = next - now;

  window._synergyReminderTimeout = setTimeout(function fire(){
    new Notification("SYNERGY — Workout Reminder", {
      body: "Time for your workout! Mark your progress & keep the streak alive 💪",
      icon: "css/images/gym-bg.jpg"
    });
    Sound.beep(980, 0.18, "sine");
    navigator.vibrate?.(180);
    // schedule next day
    scheduleDailyReminder(timeStr);
  }, delay);

  showToast(`Reminder scheduled at ${timeStr}`, 3000);
}

q("#setReminder")?.addEventListener("click", ()=> {
  const input = q("#reminderTime");
  if(!input || !input.value) return alert("Pick a time for your reminder.");
  localStorage.setItem(KEYS.REMINDER, input.value);

  if(Notification.permission !== "granted"){
    Notification.requestPermission().then(perm => {
      if(perm === "granted") scheduleDailyReminder(input.value);
      showToast("Reminder saved (permission: " + perm + ")", 3000);
    });
  } else {
    scheduleDailyReminder(input.value);
  }
});

// load saved reminder on start
(function loadReminder() {
  const saved = localStorage.getItem(KEYS.REMINDER);
  if(saved) {
    const inpt = q("#reminderTime");
    if(inpt) inpt.value = saved;
    if(Notification.permission === "granted") scheduleDailyReminder(saved);
  }
})();

/* ---------------------------
   LOGIN / SIGNUP (unchanged logic, kept integrated)
----------------------------*/
function openModal(id){
  const modal = q("#" + id);
  const overlay = q("#overlay");
  if(modal){
    modal.setAttribute("aria-hidden","false");
    modal.style.pointerEvents = "auto";
    overlay?.classList.add("show");
    overlay?.classList.remove("hidden");
  }
}
function closeModal(id){
  const modal = q("#" + id);
  const overlay = q("#overlay");
  if(modal){
    modal.setAttribute("aria-hidden","true");
    modal.style.pointerEvents = "none";
    overlay?.classList.remove("show");
    overlay?.classList.add("hidden");
  }
}

q("#openSignup")?.addEventListener("click", e => { e.preventDefault(); openModal("signupModal"); });
q("#openLogin")?.addEventListener("click", e => { e.preventDefault(); openModal("loginModal"); });

q("#openLoginFromSignup")?.addEventListener("click", e => { e.preventDefault(); closeModal("signupModal"); openModal("loginModal"); });
q("#openSignupFromLogin")?.addEventListener("click", e => { e.preventDefault(); closeModal("loginModal"); openModal("signupModal"); });

qa("[data-close]").forEach(btn => {
  const id = btn.getAttribute("data-close");
  btn.addEventListener("click", ()=> closeModal(id));
});
q("#overlay")?.addEventListener("click", () => {
  closeModal("signupModal");
  closeModal("loginModal");
});

q("#signupForm")?.addEventListener("submit", (ev)=>{
  ev.preventDefault();
  const name = q("#signupName").value.trim();
  const email = q("#signupEmail").value.trim().toLowerCase();
  const phone = q("#signupPhone").value.trim();
  const pw = q("#signupPassword").value;
  const autoLogin = q("#autoLogin").checked;

  const errEl = q("#signupError");
  errEl.innerText = "";

  if(!name || !email || !pw){
    errEl.innerText = "Please fill required fields.";
    return;
  }

  const existing = loadJSON(KEYS.USER);
  if(existing && existing.email === email){
    errEl.innerText = "An account with this email already exists.";
    return;
  }

  const user = { name, email, phone, password: pw, photo: "" };
  saveJSON(KEYS.USER, user);

  if(autoLogin) localStorage.setItem(KEYS.AUTO,"true");
  else localStorage.removeItem(KEYS.AUTO);

  closeModal("signupModal");
  showNavbarUser(user);
  showToast("Account created — demo mode", 3000);
});

q("#loginForm")?.addEventListener("submit", ev => {
  ev.preventDefault();
  const email = q("#loginEmail").value.trim().toLowerCase();
  const pw = q("#loginPassword").value;

  const errEl = q("#loginError");
  errEl.innerText = "";

  const user = loadJSON(KEYS.USER);
  if(!user || user.email !== email || user.password !== pw){
    errEl.innerText = "Incorrect credentials.";
    return;
  }

  if(q("#rememberMe")?.checked)
    localStorage.setItem(KEYS.AUTO,"true");
  else
    localStorage.removeItem(KEYS.AUTO);

  closeModal("loginModal");
  showNavbarUser(user);
  showToast("Welcome back, " + user.name.split(" ")[0], 2200);
});

function showNavbarUser(user){
  const authArea = q("#authButtonsArea");
  if(!authArea) return;
  authArea.innerHTML = `
    <div class="profile-preview" id="profilePreviewInline">
      <img id="userPhotoInline" src="${user.photo || 'css/images/default-avatar.png'}" class="profile-pic" alt="Profile"/>
      <span id="userNamePreviewInline">${user.name}</span>
      <button id="logoutBtnInline" class="login-btn">Logout</button>
    </div>
  `;
  q("#logoutBtnInline")?.addEventListener("click", logoutUser);
}

function logoutUser(){
  localStorage.removeItem(KEYS.AUTO);
  location.reload();
}

function tryAutoLogin(){
  const user = loadJSON(KEYS.USER);
  const auto = localStorage.getItem(KEYS.AUTO);
  if(user && auto === "true"){
    showNavbarUser(user);
  }
}
tryAutoLogin();

/* ---------------------------
   Startup: accessibility helpers & keyboard shortcuts
----------------------------*/
document.addEventListener("keydown", (e) => {
  // d = daily quick add (prompts) ; r = refresh weekly ; s = mark streak
  if (e.key === "d") { updateDailyProgress(); }
  if (e.key === "r") { randomizeWeekly(); }
  if (e.key === "s") { increaseStreak(); }
});

/* ---------------------------
   Expose small API for dev console
----------------------------*/
window.SYNERGY = {
  generateRoutine,
  scheduleDailyReminder,
  increaseStreak,
  updateDailyProgress,
  randomizeWeekly,
  setDailyProgress
};
