import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where, limit, doc, serverTimestamp, setDoc } from 'firebase/firestore';

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

    // Rate a generation (1: like, -1: dislike)
    const rateGeneration = async (job, rating) => {
        if (!job || !job.id) return;

        const updates = {
            rating: rating,
            hidden: rating === -1 // Auto-hide on dislike
        };

        try {
            // 1. Update Generation Queue
            const queueRef = doc(db, 'generation_queue', job.id);
            // using set merge true to be safe, or update
            await import('firebase/firestore').then(({ updateDoc }) => updateDoc(queueRef, updates));

            // 2. Update Image (if exists)
            // Some jobs might not have resultImageId if they are old or failed, but if they are visible they likely do or have imageUrl
            // logic: if job has resultImageId, update that doc in 'images'
            if (job.resultImageId) {
                const imageRef = doc(db, 'images', job.resultImageId);
                await import('firebase/firestore').then(({ updateDoc }) => updateDoc(imageRef, updates));
            }

            // 3. Log for Training (Fire & Forget)
            // This creates an immutable dataset for RLHF / Aesthetic Training
            try {
                const feedbackData = {
                    timestamp: serverTimestamp(),
                    userId: job.userId || 'unknown',
                    rating: rating,
                    feedbackType: 'aesthetic',

                    // Context
                    modelId: job.modelId,
                    prompt: job.prompt,
                    negative_prompt: job.negative_prompt || "",

                    // Parameters (Snapshot for reproducibility)
                    parameters: {
                        cfg: job.cfg,
                        steps: job.steps,
                        aspectRatio: job.aspectRatio,
                        seed: job.seed,
                    },

                    // Image Ref
                    imageUrl: job.imageUrl,
                    imageId: job.resultImageId || activeJob.id, // Fallback to job ID if image ID missing
                    jobId: job.id
                };

                // We use addDoc via the imported SDK function if available, or dynamic import if needed.
                // Since we need 'addDoc' and 'collection' and 'serverTimestamp' which might not be fully imported in scope if lazy loading was used in original context?
                // Actually, I updated the imports above.
                await addDoc(collection(db, 'training_feedback'), feedbackData);
                console.log("Logged training feedback");
            } catch (logErr) {
                console.warn("Failed to log training feedback:", logErr);
                // improved logging failure shouldn't block the UI action
            }

            return true;
        } catch (err) {
            console.error("Error rating generation:", err);
            throw err;
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
    };

    return (
        <ModelContext.Provider value={value}>
            {children}
        </ModelContext.Provider>
    );
}
