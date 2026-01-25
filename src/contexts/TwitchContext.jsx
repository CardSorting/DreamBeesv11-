import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';

const TwitchContext = createContext();

export const useTwitch = () => {
    const context = useContext(TwitchContext);
    if (!context) throw new Error("useTwitch must be used within a TwitchProvider");
    return context;
};

export const TwitchProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // Real-time listener for personas to keep them synced
        const q = query(collection(db, 'personas'), orderBy('createdAt', 'desc'), limit(100));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPersonas(all);

            // Derive categories dynamically
            const catMap = {};
            all.forEach(p => {
                if (p.category) {
                    const catName = p.category;
                    if (!catMap[catName]) {
                        catMap[catName] = {
                            id: catName.toLowerCase().replace(/\s+/g, '-'),
                            name: catName,
                            image: p.imageUrl,
                            viewers: 0,
                            hype: 0
                        };
                    }
                    // Viewers derived from ZAPs + standard random
                    const zapViewers = Math.floor((p.zapCurrent || 0) / 10);
                    catMap[catName].viewers += zapViewers + Math.floor(Math.random() * 5) + 1;
                    catMap[catName].hype += p.hypeScore || 0;
                }
            });

            // Sort categories by total hype/viewers
            const derivedCats = Object.values(catMap).sort((a, b) => b.viewers - a.viewers);
            setCategories(derivedCats);

            setFollowedPersonas(all.slice(0, 5));
            setSuggestedPersonas(all.slice(5, 15));
            setLoading(false);
        }, (error) => {
            console.error("TwitchContext Listener Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
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
