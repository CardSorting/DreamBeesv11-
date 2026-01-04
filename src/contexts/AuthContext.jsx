import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    getRedirectResult
} from "firebase/auth";
import LoadingScreen from "../components/LoadingScreen";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        // Handle redirect result first?
        // In many cases onAuthStateChanged picks it up, but getRedirectResult ensures 
        // we clear the redirect state and can handle specific post-redirect logic if needed.
        // However, for basic auth state, onAuthStateChanged is the primary listener.
        // We'll run them in parallel awareness or just rely on onAuthStateChanged 
        // to fire when the user is restored. 
        // 
        // Note: onAuthStateChanged fires with null initially, then user if found.

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth State Changed:", user ? "User logged in" : "No user");

            // If we are coming back from a redirect, sometimes we want to check getRedirectResult
            // just to clear the pending state or get additional info (like OAuth tokens).
            // But usually 'user' object is enough for session restoration.

            // To be robust against the "black screen on redirect", we ensure we don't 
            // set loading=false until we are sure. But 'onAuthStateChanged' is generally 
            // the definitive signal for "initialization complete".

            setCurrentUser(user);
            setLoading(false);
        });

        // Optional: Check for redirect result specifically if you need it.
        // getRedirectResult(auth).then((result) => {
        //   if (result) { /* User just signed in via redirect */ }
        // }).catch((error) => { /* Handle redirect error */ });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <LoadingScreen /> : children}
        </AuthContext.Provider>
    );
}
