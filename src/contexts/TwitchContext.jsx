/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { OFFICIAL_PERSONAS } from '../data/officialPersonas';

export const TwitchContext = createContext();

export const TwitchProvider = ({ children }) => {
    const [personas, setPersonas] = useState([]);
    const [followedPersonas, setFollowedPersonas] = useState([]);
    const [suggestedPersonas, setSuggestedPersonas] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // Auto-seed Official Personas (Fire-and-forget, safe fail)
        const seedOfficials = async () => {
            try {
                // Check if we can write headers or simple ping? 
                // Actually just try to seed one by one.
                for (const p of OFFICIAL_PERSONAS) {
                    const docRef = doc(db, 'personas', p.id);
                    // Just try getDoc first
                    try {
                        const snap = await getDoc(docRef);
                        if (!snap.exists()) {
                            // Only try to write if missing
                            await setDoc(docRef, {
                                ...p,
                                createdAt: serverTimestamp()
                            });
                        }
                    } catch {
                        // Silent fail for seeding - we use manual script for this anyway
                    }
                }
            } catch (e) {
                console.warn("[TwitchContext] Auto-seed failed (likely permissions), defaulting to offline mode.", e);
            }
        };
        seedOfficials();

        // Real-time listener: Bare collection fetch to rule out any query-level permission traps
        const q = collection(db, 'personas');

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!isMounted) return;

            // Map DB results
            const dbDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // HYBRID MERGE: prefer DB data, fallback to LOCAL official data
            // This ensures that if DB write failed (permissions), we still show the characters!
            const mergedOfficials = OFFICIAL_PERSONAS.map(official => {
                const foundInDb = dbDocs.find(d => d.id === official.id);
                if (foundInDb) return foundInDb;
                return official; // Fallback to local constant
            });

            // Set State
            setPersonas(mergedOfficials);
            setFollowedPersonas(mergedOfficials);
            setSuggestedPersonas([]);

            // Derive categories
            const catMap = {};
            mergedOfficials.forEach(p => {
                const catName = p.category || 'Just Chatting';
                if (!catMap[catName]) {
                    catMap[catName] = {
                        id: catName.toLowerCase().replace(/\s+/g, '-'),
                        name: catName,
                        image: p.imageUrl,
                        viewers: 0,
                        hype: 0
                    };
                }
                const zapViewers = Math.floor((p.zapCurrent || 0) / 10);
                catMap[catName].viewers += zapViewers + Math.floor(Math.random() * 5) + 1;
                catMap[catName].hype += p.hypeScore || 0;
            });

            const derivedCats = Object.values(catMap).sort((a, b) => b.viewers - a.viewers);
            setCategories(derivedCats);
            setLoading(false);

        }, (error) => {
            console.warn("TwitchContext Listener Error (Permissions?), switching to Offline Mode:", error);

            // FALLBACK TO OFFLINE MODE COMPLETELY
            if (isMounted) {
                setPersonas(OFFICIAL_PERSONAS);
                setFollowedPersonas(OFFICIAL_PERSONAS);
                setSuggestedPersonas([]);

                // Manual category derivation for offline
                const catMap = {};
                OFFICIAL_PERSONAS.forEach(p => {
                    const catName = p.category;
                    if (!catMap[catName]) {
                        catMap[catName] = {
                            id: catName.toLowerCase().replace(/\s+/g, '-'),
                            name: catName,
                            image: p.imageUrl,
                            viewers: 1200,
                            hype: 500
                        };
                    }
                });
                setCategories(Object.values(catMap));
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const value = {
        personas,
        followedPersonas,
        suggestedPersonas,
        categories,
        loading
    };

    return (
        <TwitchContext.Provider value={value}>
            {children}
        </TwitchContext.Provider>
    );
};
