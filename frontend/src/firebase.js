// src/firebase.js
import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged   // ✅ add this
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDtqCbrVHucVvrAMUftiOki7txGoAcv1tU",
  authDomain: "krushiconnect-ec76d.firebaseapp.com",
  projectId: "krushiconnect-ec76d",
  storageBucket: "krushiconnect-ec76d.firebasestorage.app",
  messagingSenderId: "853461776295",
  appId: "1:853461776295:web:c74847e5ccc038e6ae2882",
  measurementId: "G-V68BLZX3RS"
};


// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// 🔹 convenient sign in/out functions
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Google sign-in error:", error);
        return null;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
    }
};

// ✅ Export onAuthStateChanged so App.jsx can use it
export { onAuthStateChanged };
