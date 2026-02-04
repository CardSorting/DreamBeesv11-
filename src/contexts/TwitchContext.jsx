/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { OFFICIAL_PERSONAS } from '../data/officialPersonas';
import { useAuth } from './AuthContext';

export const TwitchContext = createContext();

export const TwitchProvider = ({ children }) => {
    const { currentUser } = useAuth();

    // Raw Data
    const [allPersonas, setAllPersonas] = useState([]);
    const [followingIds, setFollowingIds] = useState(new Set());
    const [loading, setLoading] = useState(true);

    // 1. Fetch Follows (User Specific)
    useEffect(() => {
        if (!currentUser) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFollowingIds(new Set());
            return;
        }

        const followsRef = collection(db, 'users', currentUser.uid, 'follows');
        const unsubUser = onSnapshot(followsRef, (snap) => {
            const ids = new Set(snap.docs.map(d => d.id));
            setFollowingIds(ids);
        }, (err) => {
            console.warn("Follows listener failed:", err);
        });

        return () => unsubUser();
    }, [currentUser]);

    // 2. Fetch Personas (Global)
    useEffect(() => {
        let isMounted = true;
        const q = collection(db, 'personas');

        const unsubPersonas = onSnapshot(q, (snapshot) => {
            if (!isMounted) return;

            const dbDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Merge with Officials (Prefer DB)
            const mergedMap = new Map();

            // Add Officials first
            OFFICIAL_PERSONAS.forEach(p => mergedMap.set(p.id, p));

            // Overwrite/Add DB docs
            dbDocs.forEach(p => mergedMap.set(p.id, { ...(mergedMap.get(p.id) || {}), ...p }));

            const finalList = Array.from(mergedMap.values());
            setAllPersonas(finalList);
            setLoading(false);

        }, (error) => {
            console.warn("Personas sync failed, using offline fallback.", error);
            if (isMounted) {
                setAllPersonas(OFFICIAL_PERSONAS);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubPersonas();
        };
    }, []);

    // 3. Derived Lists & Categories
    const { followedPersonas, suggestedPersonas, categories } = useMemo(() => {
        const followed = [];
        const suggested = [];
        const catMap = {};

        allPersonas.forEach(p => {
            // Split
            if (followingIds.has(p.id)) {
                followed.push(p);
            } else {
                suggested.push(p);
            }

            // Categories
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
            catMap[catName].viewers += zapViewers + 1;
            catMap[catName].hype += p.hypeScore || 0;
        });

        // Sorts
        suggested.sort((a, b) => (b.hypeScore || 0) - (a.hypeScore || 0));
        followed.sort((a, b) => (b.hypeScore || 0) - (a.hypeScore || 0));
        const cats = Object.values(catMap).sort((a, b) => b.viewers - a.viewers);

        return { followedPersonas: followed, suggestedPersonas: suggested, categories: cats };

    }, [allPersonas, followingIds]);


    // Action: Toggle Follow
    const toggleFollow = async (personaId) => {
        if (!currentUser) return false; // Or trigger auth modal

        const ref = doc(db, 'users', currentUser.uid, 'follows', personaId);

        if (followingIds.has(personaId)) {
            // Unfollow
            await deleteDoc(ref);
        } else {
            // Follow
            await setDoc(ref, {
                followedAt: serverTimestamp()
            });
        }
    };

    const isFollowing = (id) => followingIds.has(id);

    const value = {
        personas: allPersonas,
        followedPersonas,
        suggestedPersonas,
        categories,
        loading,
        toggleFollow,
        isFollowing
    };

    return (
        <TwitchContext.Provider value={value}>
            {children}
        </TwitchContext.Provider>
    );
};
