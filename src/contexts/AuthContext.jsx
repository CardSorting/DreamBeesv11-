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
import { doc, getDoc } from "firebase/firestore";
// import { httpsCallable } from "firebase/functions"; // Removed
import { functions, db } from "../firebase";
import LoadingScreen from "../components/LoadingScreen";
import { useApi } from "../hooks/useApi";

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


    const { call: apiCall } = useApi();

    async function ensureUserInitialized(user) {
        if (!user) return;

        try {
            // 1. Validated Check: Does user exist in Firestore?
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                console.log("User document verified exist.");
                return;
            }

            console.log("User document missing, initializing...");

            // 2. Retry Logic for Creation (Handled by useApi)
            await apiCall('api', {
                action: 'initializeUser'
            }, {
                retries: 3,
                timeout: 30000,
                toastErrors: false // Don't spam user during auto-init, we catch globally if needed
            });

            console.log("User initialization successful via useApi");

        } catch (error) {
            console.error("Critical: Failed to ensure user initialization:", error);
            // Optionally set global error state here if strict blocking is needed
        }
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

            if (user) {
                console.log(`[Auth] User detected: ${user.uid}. Ensuring initialization...`);
                try {
                    await ensureUserInitialized(user);
                    console.log("[Auth] User initialization flow complete.");
                } catch (err) {
                    console.error("[Auth] User initialization flow failed:", err);
                }
            }

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
