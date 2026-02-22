import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";

const LoginButton = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsub();
    }, []);

    const handleSignIn = async () => {
        const u = await signInWithGoogle();
        if (u) console.log("Logged in:", u.email);
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div>
            {user ? (
                <div className="flex items-center gap-2">
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    <span>{user.displayName}</span>
                    <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
                </div>
            ) : (
                <button onClick={handleSignIn} className="bg-blue-500 text-white px-4 py-2 rounded">Sign in with Google</button>
            )}
        </div>
    );
};

export default LoginButton;
