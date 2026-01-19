import { db } from '../../firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { Icons } from '../pages/MockupStudio/components/MockupIcons';
import React from 'react';

// Singleton instance module-level variable
let cachedItems = null;
let fetchPromise = null;

export const mockupCache = {
    /**
     * Retrieves mockup items, using caching to prevent redundant Firestore reads.
     * @returns {Promise<Array>} List of formatted mockup items
     */
    getAll: async () => {
        // Return existing data if available
        if (cachedItems) {
            return cachedItems;
        }

        // If a fetch is already in progress, return that promise to prevent race conditions
        if (fetchPromise) {
            return fetchPromise;
        }

        // Start new fetch
        fetchPromise = (async () => {
            try {
                // console.log('[MockupCache] 📥 Fetching from Firestore...');
                const q = query(collection(db, 'mockup_items'));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    cachedItems = [];
                    return [];
                }

                // Process and formatting logic reused from original component
                const items = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const IconComponent = Icons[data.iconName] || Icons.Print;
                    return {
                        id: doc.id,
                        ...data,
                        icon: <IconComponent className="ms-icon-lg" />
                    };
                });

                cachedItems = items;
                return items;
            } catch (error) {
                console.error('[MockupCache] ❌ Failed to load items:', error);
                // Reset promise on error so retry is possible
                fetchPromise = null;
                throw error;
            }
        })();

        return fetchPromise;
    },

    /**
     * Force reload if absolutely necessary (e.g. admin actions)
     */
    invalidate: () => {
        cachedItems = null;
        fetchPromise = null;
    }
};
