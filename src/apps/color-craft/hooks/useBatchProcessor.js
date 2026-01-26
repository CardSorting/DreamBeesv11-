import { useState, useEffect, useRef, useCallback } from 'react';
import { generateColoringPage } from '../services/geminiService';
import { saveImage } from '../services/storage';
import { ArtStyle } from '../constants';

// Safer buffer with timeout to prevent hangs
const preloadImageBuffer = (url, timeoutMs = 8000) => {
    return new Promise((resolve) => {
        let isResolved = false;
        const img = new Image();

        const done = () => {
            if (!isResolved) {
                isResolved = true;
                img.onload = null;
                img.onerror = null;
                img.src = ''; // cleanup
                resolve();
            }
        };

        img.onload = done;
        img.onerror = done;

        // Safety timeout to prevent infinite blocking
        setTimeout(() => {
            if (!isResolved) {
                done();
            }
        }, timeoutMs);

        img.src = url;
    });
};

export const useBatchProcessor = ({
    images,
    setImages,
    isQueuePaused,
    batchDelayMs = 2000
}) => {
    const isProcessingRef = useRef(false);
    const isComponentMounted = useRef(true);
    const queuePausedRef = useRef(isQueuePaused); // Ref to access current pause state inside async loop
    const [batchTotal, setBatchTotal] = useState(0);

    // Keep refs synced
    useEffect(() => {
        queuePausedRef.current = isQueuePaused;
        isComponentMounted.current = true;
        return () => { isComponentMounted.current = false; };
    }, [isQueuePaused]);

    // Stats
    const pendingCount = images.filter(img => img.status === 'pending').length;
    const generatingCount = images.filter(img => img.status === 'generating').length;
    const activeCount = pendingCount + generatingCount;

    // Batch Total Logic
    const prevActiveCount = useRef(0);
    useEffect(() => {
        const diff = activeCount - prevActiveCount.current;
        if (activeCount === 0) {
            setBatchTotal(0);
        } else {
            if (diff > 0) {
                setBatchTotal(prev => (prev === 0 ? activeCount : prev + diff));
            }
        }
        prevActiveCount.current = activeCount;
    }, [activeCount]);

    const batchProgress = batchTotal > 0 ? Math.round(((batchTotal - activeCount) / batchTotal) * 100) : 0;

    // The actual processing logic
    const processNextItem = useCallback(async function next() {
        // 1. Check conditions
        if (queuePausedRef.current || !isComponentMounted.current) {
            isProcessingRef.current = false;
            return;
        }

        // Find the next item via a functional state update to ensure we have the absolute latest state
        let itemToProcess = null;

        setImages(prev => {
            const pending = prev.find(img => img.status === 'pending');
            if (!pending) return prev; // No changes

            itemToProcess = pending;

            // Mark as generating immediately
            return prev.map(img =>
                img.id === pending.id ? { ...img, status: 'generating' } : img
            );
        });

        // If no item was found to process, stop.
        if (!itemToProcess) {
            isProcessingRef.current = false;
            return;
        }

        const currentItem = itemToProcess;
        const startTime = Date.now();

        try {
            // 2. Generate
            let styleToUse = ArtStyle.SIMPLE;
            const normalizedStyle = currentItem.style ? currentItem.style.toLowerCase() : '';
            if (normalizedStyle.includes('detailed') || normalizedStyle.includes('realistic')) styleToUse = ArtStyle.DETAILED;
            else if (normalizedStyle.includes('mandala')) styleToUse = ArtStyle.MANDALA;
            else if (normalizedStyle.includes('anime')) styleToUse = ArtStyle.ANIME;

            const url = await generateColoringPage(currentItem.prompt, styleToUse, currentItem.bookId);

            // 3. Buffer & Delay
            const generationTime = Date.now() - startTime;
            const remainingDelay = Math.max(0, batchDelayMs - generationTime);

            await Promise.all([
                preloadImageBuffer(url), // Decode image
                new Promise(resolve => setTimeout(resolve, remainingDelay)) // Min wait
            ]);

            if (!isComponentMounted.current) return;

            // 4. Save & Update
            const successItem = { ...currentItem, url, status: 'success' };
            await saveImage(successItem);

            setImages(prev => prev.map(img =>
                img.id === currentItem.id ? successItem : img
            ));

        } catch (err) {
            console.error("Batch processing error", err);
            if (isComponentMounted.current) {
                const errorItem = {
                    ...currentItem,
                    status: 'error',
                    errorMessage: err.message || "Generation failed"
                };
                await saveImage(errorItem);

                setImages(prev => prev.map(img =>
                    img.id === currentItem.id ? errorItem : img
                ));

                // Brief pause on error
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // 5. Recursive Step
        setTimeout(() => {
            next();
        }, 100);

    }, [setImages, batchDelayMs]);

    // Trigger effect
    useEffect(() => {
        if (isProcessingRef.current || isQueuePaused) return;

        const hasPending = images.some(img => img.status === 'pending');
        if (hasPending) {
            isProcessingRef.current = true;
            processNextItem();
        }
    }, [images, isQueuePaused, processNextItem]);

    return {
        batchTotal,
        batchProgress,
        pendingCount,
        generatingCount,
        activeCount,
        isProcessingBatch: activeCount > 0
    };
};
