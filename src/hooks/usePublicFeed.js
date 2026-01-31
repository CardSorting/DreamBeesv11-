import { useState, useRef, useCallback, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { smartMix } from '../utils/feedHelpers';

export function usePublicFeed(activeFilter, affinityMap, viewedIds, hiddenIds) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const [lastTimestamp, setLastTimestamp] = useState(null);
    const isFetchingRef = useRef(false);

    // Reset when filter changes
    useEffect(() => {
        setImages([]);
        setLastTimestamp(null);
        setHasMore(true);
        setLoading(true);
    }, [activeFilter]);

    const fetchGenerations = useCallback(async (isLoadMore = false) => {
        if (isFetchingRef.current) return;
        if (isLoadMore && (!lastTimestamp || !hasMore)) return;

        try {
            isFetchingRef.current = true;
            if (!isLoadMore) {
                setLoading(true);
                setError(null);
            }

            let collectionsToQuery = [];

            if (activeFilter === 'All') {
                collectionsToQuery = ['generations', 'images', 'videos', 'memes', 'mockups'];
            } else if (activeFilter === 'Images') {
                collectionsToQuery = ['images'];
            } else if (activeFilter === 'Videos') {
                collectionsToQuery = ['videos'];
            } else if (activeFilter === 'Mockups') {
                collectionsToQuery = ['generations', 'mockups'];
            } else if (activeFilter === 'Memes') {
                collectionsToQuery = ['memes'];
            }

            const PAGE_SIZE = 30;

            const queries = collectionsToQuery.map(colName => {
                let q = query(
                    collection(db, colName),
                    where('isPublic', '==', true),
                    orderBy('createdAt', 'desc'),
                    limit(PAGE_SIZE)
                );

                if (isLoadMore && lastTimestamp) {
                    q = query(q, startAfter(lastTimestamp));
                }

                return getDocs(q).then(snap => ({ colName, docs: snap.docs })).catch(err => {
                    console.warn(`Failed to fetch from ${colName}:`, err);
                    return { colName, docs: [], error: err };
                });
            });

            const results = await Promise.all(queries);

            let allDocs = [];
            results.forEach(({ colName, docs }) => {
                if (!docs) return; // Skip failed
                const normalized = docs.map(doc => {
                    const data = doc.data();
                    const hasVideo = Boolean(data.videoUrl);
                    const hasImage = Boolean(data.imageUrl || data.url || data.coverUrl);
                    const inferredType = hasVideo ? 'video' : (data.type || (hasImage ? 'image' : 'unknown'));
                    return {
                        id: doc.id,
                        ...data,
                        _collection: colName,
                        type: colName === 'videos' ? 'video' : inferredType,
                        createdAtMillis: data.createdAt?.toMillis ? data.createdAt.toMillis() :
                            (data.createdAt instanceof Date ? data.createdAt.getTime() :
                                (new Date(data.createdAt).getTime() || 0))
                    };
                });
                allDocs = [...allDocs, ...normalized];
            });

            // 1. Strict Dedupe of Fetched Docs
            const uniqueFetchedMap = new Map();
            allDocs.forEach(doc => {
                if (!uniqueFetchedMap.has(doc.id)) {
                    uniqueFetchedMap.set(doc.id, doc);
                }
            });
            const uniqueDocs = Array.from(uniqueFetchedMap.values());

            const validImages = uniqueDocs.filter(img =>
                !img.hidden &&
                (!img.status || img.status === 'completed' || img.status === 'succeeded') &&
                !hiddenIds.has(img.id) &&
                (img.imageUrl || img.url || img.coverUrl || img.videoUrl)
            );

            validImages.sort((a, b) => b.createdAtMillis - a.createdAtMillis);

            const displaySlice = validImages.slice(0, PAGE_SIZE);

            if (displaySlice.length === 0) {
                setHasMore(false);
                if (!isLoadMore) setLoading(false);
                return;
            }

            const lastItem = displaySlice[displaySlice.length - 1];
            if (lastItem.createdAt) {
                setLastTimestamp(lastItem.createdAt);
            }

            if (isLoadMore) {
                setImages(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    // 2. Filter out items already in State
                    let uniqueNew = displaySlice.filter(img => !existingIds.has(img.id));

                    // 3. Dedupe New Batch against itself (Safety belt)
                    const uniqueNewMap = new Map();
                    uniqueNew.forEach(item => uniqueNewMap.set(item.id, item));
                    uniqueNew = Array.from(uniqueNewMap.values());

                    if (uniqueNew.length === 0) return prev;
                    const mixedNewImages = smartMix(uniqueNew, affinityMap, viewedIds);
                    return [...prev, ...mixedNewImages];
                });
            } else {
                // Initial Load - Dedupe against itself just in case
                const uniqueSliceMap = new Map();
                displaySlice.forEach(item => uniqueSliceMap.set(item.id, item));
                const uniqueSlice = Array.from(uniqueSliceMap.values());

                const mixedImages = smartMix(uniqueSlice, affinityMap, viewedIds);
                setImages(mixedImages);
            }

            if (validImages.length < 5) {
                setHasMore(false);
            }

        } catch (error) {
            console.error("Error fetching generations:", error);
            setError("Failed to load feed. Please try again.");
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
        }
    }, [activeFilter, lastTimestamp, hasMore, affinityMap, viewedIds, hiddenIds]);

    return {
        images,
        loading,
        hasMore,
        error,
        fetchGenerations
    };
}
