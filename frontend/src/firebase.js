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
    apiKey: "AIzaSyCpvcnbGOqMv13OfOsaXIt48uf9akPlejo",
    authDomain: "krushiconnect12.firebaseapp.com",
    projectId: "krushiconnect12",
    storageBucket: "krushiconnect12.firebasestorage.app",
    messagingSenderId: "701793260800",
    appId: "1:701793260800:web:2d4ebcac9ed2745ad04fe5",
    measurementId: "G-KRXX3E1DGS"
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
