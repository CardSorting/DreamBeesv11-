import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where, limit, doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';

const ModelContext = createContext();

export function useModel() {
    return useContext(ModelContext);
}

export function ModelProvider({ children }) {
    const [availableModels, setAvailableModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load initialization
    useEffect(() => {
        const savedModelId = localStorage.getItem('selectedModelId');

        const fetchModels = async () => {
            try {
                setLoading(true);
                const modelsRef = collection(db, 'models');
                const q = query(modelsRef, orderBy('order', 'asc'));
                const querySnapshot = await getDocs(q);

                const models = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    models.push({
                        id: doc.id,
                        ...data,
                        tags: Array.isArray(data.tags) ? data.tags : []
                    });
                });

                setAvailableModels(models);

                // Prioritize saved model, then current selection (if any), then default
                if (models.length > 0) {
                    if (savedModelId) {
                        const saved = models.find(m => m.id === savedModelId);
                        if (saved) {
                            setSelectedModel(saved);
                        } else {
                            setSelectedModel(models[0]);
                        }
                    } else if (!selectedModel) {
                        setSelectedModel(models[0]);
                    }
                }
                setLoading(false);
            } catch (err) {
                // ... error handling ...
                console.error("Error fetching models:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchModels();
    }, []);

    // Persist selection
    useEffect(() => {
        if (selectedModel) {
            localStorage.setItem('selectedModelId', selectedModel.id);
        }
    }, [selectedModel]);

    const [showcaseCache, setShowcaseCache] = useState({});

    // Fetch and cache showcase images for a model
    const getShowcaseImages = async (modelId) => {
        // 1. Check cache
        if (showcaseCache[modelId]) {
            return showcaseCache[modelId];
        }

        // 2. Try Local Manifest First
        try {
            console.log(`[Cache Miss] Fetching local showcase for ${modelId}`);
            const response = await fetch(`/showcase/${modelId}/manifest.json`);
            if (response.ok) {
                const localData = await response.json();
                console.log(`[Local Showcase] Found ${localData.length} items for ${modelId}`);

                // Transform to match Firestore shape if needed, though they seem similar
                const images = localData.map((item, index) => ({
                    id: `local_${modelId}_${index}`,
                    imageUrl: item.url, // manifest uses 'url', our app expects 'imageUrl' usually? app checks getOptimizedImageUrl(img.imageUrl)
                    ...item
                }));

                // Update Cache and Return
                setShowcaseCache(prev => ({ ...prev, [modelId]: images }));
                return images;
            }
        } catch (localErr) {
            console.warn(`[Local Showcase] Failed to load manifest for ${modelId}`, localErr);
            // Fallthrough to Firestore on error
        }

        // 3. Fallback to Firestore
        try {
            console.log(`[Firestore Fallback] Fetching showcase for ${modelId}`);
            const q = query(
                collection(db, 'model_showcase_images'),
                where('modelId', '==', modelId),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(q);

            let images = [];
            if (!snapshot.empty) {
                images = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

            // 4. Update Cache
            setShowcaseCache(prev => ({ ...prev, [modelId]: images }));
            return images;
        } catch (err) {
            console.error("Error fetching showcase images:", err);
            return [];
        }
    };

    // --- High Velocity Rating Logic (Buffered) ---
    const ratingQueue = useRef(new Map()); // stores { job, rating, timestamp } by jobId
    const flushInterval = useRef(null);

    // Process the queue every 3 seconds or on unmount
    useEffect(() => {
        const processQueue = async () => {
            if (ratingQueue.current.size === 0) return;

            const batch = writeBatch(db);
            const queueSnapshot = new Map(ratingQueue.current);
            ratingQueue.current.clear(); // Clear immediately to allow potentially new fast updates

            console.log(`[Batch] Flushing ${queueSnapshot.size} ratings...`);

            queueSnapshot.forEach(({ job, rating }) => {
                const updates = {
                    rating: rating,
                    hidden: rating === -1
                };

                // 1. Generation Queue (UI State)
                const queueRef = doc(db, 'generation_queue', job.id);
                batch.update(queueRef, updates);

                // 2. Images Collection (UI State)
                if (job.resultImageId) {
                    const imageRef = doc(db, 'images', job.resultImageId);
                    batch.update(imageRef, updates);
                }

                // 3. Training Feedback (ML Ops - Robust)
                const feedbackId = `feedback_${job.id}`;
                const feedbackRef = doc(db, 'training_feedback', feedbackId);

                // MLOps: Resolution Mapping
                const resolutionMap = {
                    '1:1': { width: 1024, height: 1024 },
                    '2:3': { width: 832, height: 1216 },
                    '3:2': { width: 1216, height: 832 },
                    '9:16': { width: 768, height: 1344 },
                    '16:9': { width: 1344, height: 768 }
                };
                const res = resolutionMap[job.aspectRatio] || resolutionMap['1:1'];

                // MLOps: Deterministic Split
                // Simple deterministic hash
                const simpleHash = job.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const split = (simpleHash % 100) < 90 ? 'train' : 'validation';

                const feedbackData = {
                    _id: feedbackId,
                    timestamp: serverTimestamp(),
                    dataset_split: split,
                    weight: 1.0,
                    rating: rating,
                    meta: {
                        modelId: job.modelId,
                        prompt_cleaned: job.prompt ? job.prompt.trim() : "",
                        negative_prompt: job.negative_prompt || "",
                        cfg: parseFloat(job.cfg),
                        steps: parseInt(job.steps),
                        seed: parseInt(job.seed),
                        width: res.width,
                        height: res.height,
                        aspect_ratio_label: job.aspectRatio
                    },
                    asset_pointers: {
                        image_url: job.imageUrl,
                        gen_doc_path: `generation_queue/${job.id}`,
                        user_id: job.userId
                    }
                };

                // Use set (upsert) for idempotency
                batch.set(feedbackRef, feedbackData);
            });

            try {
                await batch.commit();
                console.log("[Batch] Successfully committed ratings.");
            } catch (err) {
                console.error("[Batch] Failed to commit ratings:", err);
            }
        };

        flushInterval.current = setInterval(processQueue, 3000); // Flush every 3s

        return () => {
            if (flushInterval.current) clearInterval(flushInterval.current);
            processQueue();
        };
    }, []);

    // Rate a generation (Buffered / Fire & Forget)
    const rateGeneration = async (job, rating) => {
        if (!job || !job.id) return;

        // Add to queue (Debounces automatically by Map key)
        ratingQueue.current.set(job.id, { job, rating, timestamp: Date.now() });
        console.log(`[Rate] Queued rating ${rating} for ${job.id}`);
        return true;
    };

    // Rate a showcase image (Direct Update, No Hide on Downvote)
    const rateShowcaseImage = async (imageId, rating, modelId) => {
        if (!imageId || !modelId) return;

        try {
            console.log(`[Rate Showcase] Rating ${rating} for ${imageId}`);
            const imageRef = doc(db, 'model_showcase_images', imageId);
            await setDoc(imageRef, {
                rating: rating,
                ratingTimestamp: serverTimestamp() // Track when it was rated
            }, { merge: true });

            // Optimistically update cache
            setShowcaseCache(prev => {
                const currentImages = prev[modelId] || [];
                return {
                    ...prev,
                    [modelId]: currentImages.map(img =>
                        img.id === imageId ? { ...img, rating: rating } : img
                    )
                };
            });
            return true;
        } catch (e) {
            console.error("Error rating showcase image:", e);
            return false;
        }
    };

    const value = {
        selectedModel,
        setSelectedModel,
        availableModels,
        loading,
        error,
        getShowcaseImages, // Exported function
        showcaseCache,     // Exported state (optional, mainly for debugging)
        rateGeneration,    // EXPORTED
        rateShowcaseImage, // EXPORTED
    };

    return (
        <ModelContext.Provider value={value}>
            {children}
        </ModelContext.Provider>
    );
}
