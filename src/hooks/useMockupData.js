import { useState, useRef, useCallback, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';

export function useMockupData(creatorFilter) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const lastDocRef = useRef(null);
    const isFetchingRef = useRef(false);
    const hasMoreRef = useRef(true);

    const fetchMockups = useCallback(async (isLoadMore = false) => {
        if (isFetchingRef.current) return;
        if (isLoadMore && (!lastDocRef.current || !hasMoreRef.current)) return;

        try {
            setLoading(true);
            isFetchingRef.current = true;

            let q = query(
                collection(db, 'generations'),
                where('type', '==', 'mockup'),
                where('isPublic', '==', true),
                orderBy('createdAt', 'desc'),
                limit(20)
            );

            const paginationDoc = lastDocRef.current;
            if (isLoadMore && paginationDoc) {
                q = query(q, startAfter(paginationDoc));
            }

            if (creatorFilter) {
                if (creatorFilter.type === 'tag') {
                    q = query(q, where('tags', 'array-contains', creatorFilter.value));
                } else if (creatorFilter.id) {
                    q = query(q, where('userId', '==', creatorFilter.id));
                }
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setHasMore(false);
                hasMoreRef.current = false;
                if (!isLoadMore) setLoading(false);
                return;
            }

            const newImages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];

            if (isLoadMore) {
                setImages(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newImages.filter(img => !existingIds.has(img.id));
                    return [...prev, ...uniqueNew];
                });
            } else {
                setImages(newImages);
            }
        } catch (error) {
            console.error("Error fetching mockups:", error);
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
        }
    }, [creatorFilter]); // Removed hasMore to stabilize function identity

    useEffect(() => {
        setImages([]);
        lastDocRef.current = null;
        isFetchingRef.current = false;
        setHasMore(true);
        hasMoreRef.current = true;
        fetchMockups();
    }, [creatorFilter, fetchMockups]);

    return {
        images,
        loading,
        hasMore,
        fetchMockups
    };
}
