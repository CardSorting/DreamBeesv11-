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
    const [personas, setPersonas] = useState([]);
    const [followedPersonas, setFollowedPersonas] = useState([]);
    const [suggestedPersonas, setSuggestedPersonas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for personas to keep them synced
        const q = query(collection(db, 'personas'), orderBy('createdAt', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPersonas(all);

            // Mocking followed vs suggested for now
            // In a real app, this would check a 'follows' collection in Firestore
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
        loading
    };

    return (
        <TwitchContext.Provider value={value}>
            {children}
        </TwitchContext.Provider>
    );
};
