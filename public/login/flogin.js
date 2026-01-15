import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Initialize Lucide icons
if (window.lucide) {
  lucide.createIcons();
}

let auth = null; 

// 1. FETCH CONFIG FROM BACKEND API
async function initFirebase() {
  try {
    const response = await fetch('/api/login');
    
    if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
    }

    const firebaseConfig = await response.json();

    // Check if the API actually returned data
    if (!firebaseConfig.apiKey) {
      throw new Error("API returned empty config. Check Vercel Environment Variables.");
    }

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Listen for state changes (auto-redirect if already logged in)
    onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.href = "/home";
      }
    });

    console.log("✅ Firebase connection established via API");

  } catch (err) {
    console.error("❌ Failed to load Firebase config:", err);
    alert("Connection Error: Server config is missing. Please ensure Environment Variables are set in Vercel.");
  }
}

initFirebase();

// --- UI ELEMENTS ---
const overlay = document.getElementById("loginOverlay");
const btnSubmit = document.getElementById("btnSubmit");
const inputEmail = document.getElementById("inputEmail");
const inputPass = document.getElementById("inputPass");
const inputName = document.getElementById("inputName");
const authTitle = document.getElementById("authTitle");
const toggleAuthBtn = document.getElementById("toggleAuth");
const groupName = document.getElementById("groupName");

let isSignup = false;

// --- UI TOGGLE LOGIC ---
if (toggleAuthBtn) {
  toggleAuthBtn.onclick = (e) => {
    e.preventDefault();
    isSignup = !isSignup;
    updateUI();
  };
}

function updateUI() {
  if (!authTitle || !btnSubmit) return;
  
  if (isSignup) {
    authTitle.innerText = "Create Account";
    btnSubmit.innerText = "Sign Up";
    groupName?.classList.remove("hidden");
  } else {
    authTitle.innerText = "Welcome back";
    btnSubmit.innerText = "Log in";
    groupName?.classList.add("hidden");
  }
}

// --- HANDLE SUBMIT ---
if (btnSubmit) {
  btnSubmit.onclick = async () => {
    // Check if API fetch has finished
    if (!auth) {
      alert("Still connecting to server... please wait a moment.");
      return;
    }

    const email = inputEmail.value.trim();
    const pass = inputPass.value.trim();
    const name = inputName ? inputName.value.trim() : "";

    if (!email || !pass) {
      alert("Please fill in all fields.");
      return;
    }

    btnSubmit.innerText = "Processing...";
    btnSubmit.disabled = true;

    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, {
          displayName: name,
          photoURL: `https://api.dicebear.com/9.x/lorelei/svg?seed=${name}`,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      // Successful login/signup will trigger onAuthStateChanged redirect
    } catch (err) {
      console.error(err);
      alert("Auth Error: " + err.message);
      btnSubmit.disabled = false;
      btnSubmit.innerText = isSignup ? "Sign Up" : "Log in";
    }
  };
}
