lucide.createIcons();

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let auth;

// 1. FETCH CONFIG FROM BACKEND API
async function initFirebase() {
  try {
    const response = await fetch('/api/login');
    const firebaseConfig = await response.json();
    
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // After auth is ready, listen for state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.href = "/home";
      }
    });
  } catch (err) {
    console.error("Failed to load Firebase config:", err);
  }
}

initFirebase();

// UI ELEMENTS
const overlay = document.getElementById("loginOverlay");
const closeBtn = document.getElementById("closeOverlayBtn");
const getStartedBtn = document.getElementById("getStartedBtn");
const heroGetStartedBtn = document.getElementById("heroGetStartedBtn");
const toggleAuthBtn = document.getElementById("toggleAuth");

// FORM ELEMENTS
const authTitle = document.getElementById("authTitle");
const btnSubmit = document.getElementById("btnSubmit");
const groupName = document.getElementById("groupName");
const inputName = document.getElementById("inputName");
const inputEmail = document.getElementById("inputEmail");
const inputPass = document.getElementById("inputPass");
const authAvatar = document.getElementById("authAvatar");

let isSignup = false;

function openOverlay() {
  if(overlay) {
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    isSignup = false;
    updateUI();
  }
}

function closeOverlay() {
  if(overlay) {
    overlay.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

if (getStartedBtn) getStartedBtn.onclick = openOverlay;
if (heroGetStartedBtn) heroGetStartedBtn.onclick = openOverlay;
if (closeBtn) closeBtn.onclick = closeOverlay;

if (toggleAuthBtn) {
  toggleAuthBtn.onclick = () => {
    isSignup = !isSignup;
    updateUI();
  };
}

function updateUI() {
  if (!authTitle || !btnSubmit || !toggleAuthBtn) return;
  if (isSignup) {
    authTitle.innerText = "Create Account";
    btnSubmit.innerText = "Sign Up";
    toggleAuthBtn.innerHTML = 'Already have an account? <span>Log in</span>';
    groupName.classList.remove("hidden");
  } else {
    authTitle.innerText = "Welcome back";
    btnSubmit.innerText = "Log in";
    toggleAuthBtn.innerHTML = "Don't have an account? <span>Create one</span>";
    groupName.classList.add("hidden");
  }
}

// HANDLE SUBMIT
if (btnSubmit) {
  btnSubmit.onclick = async () => {
    if (!auth) return; // Wait for config to load

    const email = inputEmail.value.trim();
    const pass = inputPass.value.trim();
    const name = inputName.value.trim();

    if (!email || !pass) {
      alert("Please fill in email and password");
      return;
    }

    btnSubmit.innerText = "Processing...";
    btnSubmit.disabled = true;

    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, {
          displayName: name,
          photoURL: `https://api.dicebear.com/9.x/lorelei/svg?seed=${name}&backgroundColor=transparent`,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      window.location.href = "/home";
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerText = isSignup ? "Sign Up" : "Log in";
    }
  };
}
