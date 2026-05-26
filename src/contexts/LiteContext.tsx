/**
 * [LAYER: INFRASTRUCTURE]
 */
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef, useMemo } from 'react';
import {
    GenerationStage,
    ENQUEUE_RETRY_MESSAGE,
    LONG_RUNNING_MESSAGE,
    clearPendingGeneration,
    loadPendingGeneration,
    mergeGenerationHistory,
    messageForStage,
    monotonicProgress,
    preloadImage,
    progressPercent,
    savePendingGeneration,
    smoothIdleProgress,
    stageFromQueueDoc,
} from '../lib/generationFlow';
import toast from 'react-hot-toast';
import { auth, db, functions } from '../firebase.ts';
import { httpsCallable } from 'firebase/functions';
import { 
    onAuthStateChanged, 
    User, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    GoogleAuthProvider, 
    signInWithPopup,
    signInWithCredential
} from 'firebase/auth';
import { collection, doc, onSnapshot, query, orderBy, limit, where, setDoc, serverTimestamp, enableNetwork, disableNetwork } from 'firebase/firestore';
import { AIModel, getOptimizedImageUrl } from '../lite-utils';

const BUILTIN_MODELS: AIModel[] = [
    {
        id: 'wai-illustrious',
        name: 'WAI Illustrious',
        description: 'Illustration + character art. Great for cute, sticker, and storybook looks.',
        image: '/build/icon.png',
        order: 1
    },
    {
        id: 'flux-realistic',
        name: 'Flux Realistic',
        description: 'Photo-like lighting and detail. Great for portraits and product shots.',
        image: '/build/icon.png',
        order: 2
    },
    {
        id: 'cinematic',
        name: 'Cinematic',
        description: 'Dramatic lighting, film look, and rich mood.',
        image: '/build/icon.png',
        order: 3
    },
    {
        id: 'creative',
        name: 'Creative',
        description: 'Stylized and imaginative. Good for fantasy scenes and playful ideas.',
        image: '/build/icon.png',
        order: 4
    }
];

interface LiteContextType {
    currentUser: User | null;
    availableModels: AIModel[];
    modelsError: string | null;
    selectedModel: AIModel | null;
    setSelectedModel: (model: AIModel) => void;
    history: any[];
    localHistory: any[];
    displayHistory: any[];
    loading: boolean;
    generating: boolean;
    generationStage: GenerationStage;
    generationProgress: number;
    generationPreviewUrl: string | null;
    activeGeneration: { requestId: string; prompt: string } | null;
    generateStartTime: number | undefined;
    generate: (prompt: string, params?: any) => Promise<boolean>;
    login: (email: string, pass: string) => Promise<void>;
    signup: (email: string, pass: string, birthday: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    isOffline: boolean;
    userTier: 'free' | 'pro' | 'architect';
    zaps: number | 'unlimited';
    addToast: (message: string, type?: 'success' | 'error' | 'loading', id?: string) => string;
}

const LiteContext = createContext<LiteContextType | undefined>(undefined);

export const useLite = () => {
    const context = useContext(LiteContext);
    if (!context) throw new Error('useLite must be used within LiteProvider');
    return context;
};

export function LiteProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
    const [modelsError, setModelsError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [localHistory, setLocalHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generationStage, setGenerationStage] = useState<GenerationStage>('idle');
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationPreviewUrl, setGenerationPreviewUrl] = useState<string | null>(null);
    const [activeGeneration, setActiveGeneration] = useState<{ requestId: string; prompt: string } | null>(null);
    const generationSessionRef = useRef<(() => void) | null>(null);
    const generatingRef = useRef(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [cooldownUntil, setCooldownUntil] = useState<number>(0);
    const [consecutiveFailures, setConsecutiveFailures] = useState(0);
    const [generateStartTime, setGenerateStartTime] = useState<number | undefined>(undefined);
    const [userTier, setUserTier] = useState<'free' | 'pro' | 'architect'>('free');
    const [zaps, setZaps] = useState<number | 'unlimited'>(10);

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'loading' = 'success', existingId?: string) => {
        if (type === 'loading') return toast.loading(message, { id: existingId });
        if (type === 'error') return toast.error(message, { id: existingId });
        return toast.success(message, { id: existingId });
    }, []);

    useEffect(() => {
        const handleOnline = () => { setIsOffline(false); enableNetwork(db); toast.success("Network restored"); };
        const handleOffline = () => { setIsOffline(true); disableNetwork(db); toast.error("Offline Mode Active"); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        return onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            if (!user) {
                setLoading(false);
                setUserTier('free');
                setZaps(10);
                return;
            }

            // Fetch user data from Firestore
            const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
                if (snap.exists()) {
                    const data = snap.data();
                    setUserTier(data.tier || 'free');
                    setZaps(data.zaps ?? (data.tier === 'pro' || data.tier === 'architect' ? 'unlimited' : 10));
                }
                setLoading(false);
            }, err => {
                console.warn('[Lite] User data fetch failed:', err);
                setLoading(false);
            });

            return () => unsub();
        });
    }, []);

    const loadLocal = useCallback(async () => {
        try {
            if (window.electronAPI?.lite) {
                const gens = await window.electronAPI.lite.getGenerations(50);
                setLocalHistory(gens);
            }
        } catch (err) {
            console.warn('[Lite] Local history unavailable:', err);
        }
    }, []);

    useEffect(() => { loadLocal(); }, [loadLocal]);

    const resetGenerationUi = useCallback(() => {
        setGenerating(false);
        setGenerationStage('idle');
        setGenerationProgress(0);
        setGenerationPreviewUrl(null);
        setActiveGeneration(null);
        setGenerateStartTime(undefined);
    }, []);

    useEffect(() => () => { generationSessionRef.current?.(); }, []);

    /** Re-attach to an in-flight job after navigation refresh */
    useEffect(() => {
        if (!currentUser || generatingRef.current) return;

        const pending = loadPendingGeneration();
        if (!pending) return;

        generatingRef.current = true;
        setGenerating(true);
        setGenerationStage('processing');
        setGenerationProgress(40);
        setActiveGeneration({ requestId: pending.requestId, prompt: pending.prompt });
        setGenerateStartTime(pending.startedAt);
        toast.loading('Checking on your picture…', { id: pending.requestId });

        let settled = false;
        let progressFloor = 40;

        const finish = () => {
            generatingRef.current = false;
            clearPendingGeneration();
        };

        const unsub = onSnapshot(doc(db, 'generation_queue', pending.requestId), async (snap) => {
            const data = snap.data();
            if (!data || settled) return;

            if (data.status === 'queued' || data.status === 'processing') {
                const stage = stageFromQueueDoc(data);
                const next = progressPercent(stage, data.progress);
                progressFloor = monotonicProgress(progressFloor, next);
                setGenerationStage(stage);
                setGenerationProgress(progressFloor);
                toast.loading(messageForStage(stage), { id: pending.requestId });
                const preview = data.thumbnailUrl || data.lqip || data.imageUrl;
                if (preview) setGenerationPreviewUrl(preview as string);
                return;
            }

            if (data.status === 'completed' && data.imageUrl) {
                settled = true;
                unsub();
                finish();
                const entry = {
                    id: pending.requestId,
                    prompt: pending.prompt,
                    imageUrl: data.imageUrl as string,
                    createdAt: Date.now()
                };
                await preloadImage(getOptimizedImageUrl(data.imageUrl as string) || data.imageUrl as string);
                setLocalHistory(prev => [entry, ...prev.filter(i => i.id !== pending.requestId)]);
                resetGenerationUi();
                toast.success('Your picture is ready!', { id: pending.requestId });
                if (window.electronAPI?.lite) {
                    try {
                        await window.electronAPI.lite.saveGeneration(entry);
                        loadLocal();
                    } catch { /* ignore */ }
                }
                return;
            }

            if (data.status === 'failed') {
                settled = true;
                unsub();
                finish();
                resetGenerationUi();
                toast.error((data.error as string) || 'Something went wrong.', { id: pending.requestId });
            }
        });

        return () => {
            settled = true;
            unsub();
        };
    }, [currentUser, loadLocal, resetGenerationUi]);

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'lite_selected_model' && e.newValue && availableModels.length > 0) {
                const model = availableModels.find(m => m.id === e.newValue);
                if (model) setSelectedModel(model);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [availableModels]);

    useEffect(() => {
        setModelsError(null);

        const pickDefaultModel = (models: AIModel[]) => {
            if (models.length === 0) return;
            const savedId = localStorage.getItem('lite_selected_model');
            const savedModel = models.find(m => m.id === savedId);

            if (savedModel && (!selectedModel || selectedModel.id !== savedModel.id)) {
                setSelectedModel(savedModel);
            } else if (!selectedModel) {
                setSelectedModel(models[0]);
            }
        };

        const orderedQuery = query(collection(db, 'models'), orderBy('order', 'asc'), limit(12));
        const fallbackQuery = query(collection(db, 'models'), limit(12));

        let activeUnsub: (() => void) | null = null;
        let stopped = false;

        const subscribeFallback = (previousError?: unknown) => {
            if (stopped) return;
            const msg = (previousError as any)?.message ? String((previousError as any).message) : 'Failed to load styles.';
            setModelsError(msg);

            activeUnsub = onSnapshot(
                fallbackQuery,
                snap => {
                    const models = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIModel));
                    setAvailableModels(models);
                    setModelsError(models.length ? null : msg);
                    pickDefaultModel(models);
                },
                err2 => {
                    console.warn('[Lite] Model subscription failed (fallback):', err2);
                    // Final fallback: ship a small built-in set of styles so the app still works.
                    setAvailableModels(BUILTIN_MODELS);
                    setModelsError((err2 as any)?.message ? String((err2 as any).message) : msg);
                    pickDefaultModel(BUILTIN_MODELS);
                }
            );
        };

        activeUnsub = onSnapshot(
            orderedQuery,
            snap => {
                const models = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIModel));
                setAvailableModels(models);
                setModelsError(null);
                pickDefaultModel(models);
            },
            err => {
                console.warn('[Lite] Model subscription failed (ordered):', err);
                if (activeUnsub) {
                    activeUnsub();
                    activeUnsub = null;
                }
                subscribeFallback(err);
            }
        );

        return () => {
            stopped = true;
            if (activeUnsub) activeUnsub();
        };
    }, [selectedModel]);

    useEffect(() => {
        if (!currentUser) { setHistory([]); return; }
        const q = query(
            collection(db, 'images'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        return onSnapshot(q, snap => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => {
            console.warn('[Lite] History subscription failed:', err);
            setHistory([]);
        });
    }, [currentUser]);

    const displayHistory = useMemo(
        () => mergeGenerationHistory(localHistory, history),
        [localHistory, history]
    );

    const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass).then(() => {});
    
    const signup = async (email: string, pass: string, birthday: string) => {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        if (res.user) {
            // Explicit initialization call to ensure backend consistency
            try {
                const apiCall = httpsCallable(functions, 'api');
                await apiCall({ 
                    action: 'initializeUser', 
                    birthday 
                });
            } catch (err) {
                console.error('[Lite] User initialization failed:', err);
                // Fallback to local set if API fails (but JIT will catch it later anyway)
                await setDoc(doc(db, 'users', res.user.uid), {
                    email,
                    birthday,
                    createdAt: serverTimestamp(),
                    tier: 'free',
                    zaps: 10
                }, { merge: true });
            }
        }
    };

    const logout = () => signOut(auth).then(() => { toast.success("Safe travels."); });

    const loginWithGoogle = async () => {
        try {
            console.log("[Lite Auth] Version 1.1.2. Electron API:", Boolean(window.electronAPI?.lite?.googleLogin));
            const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
            const hasNativeLogin = Boolean(window.electronAPI?.lite?.googleLogin);
            
            if (isElectron && hasNativeLogin) {
                addToast("Establishing secure link...", "loading", "google-auth");
                
                const authData = await window.electronAPI.lite.googleLogin();
                console.log("[Lite Auth] Received data from bridge:", authData ? "YES" : "NO");
                addToast("Identity confirmed. Finalizing...", "loading", "google-auth");
                
                const { idToken, accessToken } = authData;

                if (!idToken) throw new Error("The identity portal returned an incomplete response. Please try again.");

                console.log("[Lite Auth] Creating Firebase credential...");
                const credential = GoogleAuthProvider.credential(idToken, accessToken || undefined);
                const res = await signInWithCredential(auth, credential);

                if (res.user) {
                    await setDoc(doc(db, 'users', res.user.uid), {
                        email: res.user.email,
                        lastLogin: serverTimestamp(),
                        platform: 'electron',
                        tier: 'free',
                        zaps: 10
                    }, { merge: true });
                    addToast(`Welcome back, ${res.user.displayName?.split(' ')[0]}`, "success", "google-auth");
                }
            } else {
                const provider = new GoogleAuthProvider();
                const res = await signInWithPopup(auth, provider);
                if (res.user) {
                    await setDoc(doc(db, 'users', res.user.uid), {
                        email: res.user.email,
                        lastLogin: serverTimestamp(),
                        tier: 'free',
                        zaps: 10
                    }, { merge: true });
                    toast.success(`Welcome back, ${res.user.displayName?.split(' ')[0]}`);
                }
            }
        } catch (err: any) {
            console.error('[Lite Auth Error]', err);
            toast.error(err.message || "The vision was interrupted.");
        }
    };

    const calculateEstimatedCost = (modelId: string, tier: string) => {
        if (tier === 'pro' || tier === 'architect') return 0;
        if (['wai-illustrious', 'nova-3d-cg-xl'].includes(modelId)) return 1.0;
        return 0.5;
    };

    const generate = useCallback((prompt: string, params: any = {}): Promise<boolean> => {
        const cleanPrompt = prompt?.trim();
        if (!cleanPrompt) return Promise.resolve(false);
        if (generatingRef.current) return Promise.resolve(false);
        if (isOffline) { toast.error("The garden requires a connection to bloom."); return Promise.resolve(false); }
        if (!currentUser || !selectedModel) { toast.error("Identity unknown. Please sign in."); return Promise.resolve(false); }
        
        if (zaps !== 'unlimited' && zaps <= 0) {
            toast.error("You have exhausted your Zaps. Upgrade to continue creating.", { id: 'no-zaps' });
            return Promise.resolve(false);
        }

        if (Date.now() < cooldownUntil) {
            const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
            toast.error(`Service is cooling down. Please wait ${remaining}s...`, { id: 'cooldown' });
            return Promise.resolve(false);
        }

        return new Promise<boolean>((resolve) => {
        generatingRef.current = true;
        const estimatedCost = calculateEstimatedCost(selectedModel.id, userTier);
        const requestId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        generationSessionRef.current?.();

        setGenerating(true);
        setGenerationStage('submitting');
        setGenerationProgress(10);
        setGenerationPreviewUrl(null);
        setActiveGeneration({ requestId, prompt: cleanPrompt });
        setGenerateStartTime(Date.now());
        savePendingGeneration({ requestId, prompt: cleanPrompt, startedAt: Date.now() });
        toast.loading(messageForStage('submitting'), { id: requestId });

        if (typeof zaps === 'number' && estimatedCost > 0) {
            setZaps(prev => typeof prev === 'number' ? Math.max(0, prev - estimatedCost) : prev);
        }

        let unsub: (() => void) | null = null;
        let idleTick: ReturnType<typeof setInterval> | null = null;
        const softTimeoutIds: ReturnType<typeof setTimeout>[] = [];
        let settled = false;
        let apiAccepted = false;
        let sawQueueDoc = false;
        let progressFloor = 10;

        const rollbackCredits = () => {
            if (estimatedCost > 0) {
                setZaps(prev => typeof prev === 'number' ? prev + estimatedCost : prev);
            }
        };

        const finishSession = () => {
            softTimeoutIds.forEach(clearTimeout);
            if (idleTick) clearInterval(idleTick);
            if (unsub) unsub();
            unsub = null;
            idleTick = null;
            generatingRef.current = false;
            clearPendingGeneration();
            if (generationSessionRef.current === finishSession) {
                generationSessionRef.current = null;
            }
        };

        const failGeneration = (message: string, rollback = !apiAccepted) => {
            if (settled) return;
            settled = true;
            finishSession();
            if (rollback) rollbackCredits();
            resetGenerationUi();
            toast.error(message, { id: requestId });
            setConsecutiveFailures(prev => {
                const next = prev + 1;
                if (next >= 3) setCooldownUntil(Date.now() + 120000);
                return next;
            });
            resolve(false);
        };

        const succeedGeneration = async (data: { imageUrl: string }) => {
            if (settled) return;
            settled = true;
            finishSession();
            setGenerationProgress(100);

            const optimizedUrl = getOptimizedImageUrl(data.imageUrl) || data.imageUrl;
            await preloadImage(optimizedUrl);

            const entry = {
                id: requestId,
                prompt: cleanPrompt,
                imageUrl: data.imageUrl,
                modelId: selectedModel.id,
                params,
                createdAt: Date.now()
            };
            setLocalHistory(prev => [entry, ...prev.filter(i => i.id !== requestId)]);

            resetGenerationUi();
            toast.success("Your picture is ready!", { id: requestId });
            setConsecutiveFailures(0);
            
            if (window.electronAPI?.lite) {
                try {
                    await window.electronAPI.lite.saveGeneration(entry);
                    loadLocal();
                } catch (err) {
                    console.warn('[Lite] Local save skipped:', err);
                }
            }
            resolve(true);
        };

        generationSessionRef.current = finishSession;

        idleTick = setInterval(() => {
            if (settled || sawQueueDoc) return;
            progressFloor = smoothIdleProgress(progressFloor);
            setGenerationProgress(progressFloor);
        }, 700);

        softTimeoutIds.push(
            setTimeout(() => {
                if (!settled) toast.loading(LONG_RUNNING_MESSAGE, { id: requestId });
            }, 60000),
            setTimeout(() => {
                if (!settled) toast.loading(LONG_RUNNING_MESSAGE, { id: requestId });
            }, 120000)
        );

        const applyQueueUpdate = (data: Record<string, unknown>) => {
            sawQueueDoc = true;
            const stage = stageFromQueueDoc(data as { status?: string; stage?: string });
            const progress = progressPercent(stage, data.progress as number | undefined);
            progressFloor = monotonicProgress(progressFloor, progress);
            setGenerationStage(stage);
            setGenerationProgress(progressFloor);
            toast.loading(messageForStage(stage), { id: requestId });

            if (data.enqueueError && !data.enqueuedAt) {
                toast.loading(ENQUEUE_RETRY_MESSAGE, { id: requestId });
            }

            const preview = (data.thumbnailUrl || data.lqip || data.imageUrl) as string | undefined;
            if (preview) {
                setGenerationPreviewUrl(preview);
                const fullUrl = data.imageUrl as string | undefined;
                if (fullUrl) {
                    preloadImage(getOptimizedImageUrl(fullUrl) || fullUrl);
                }
            }
        };

        unsub = onSnapshot(doc(db, 'generation_queue', requestId), (snap) => {
            const data = snap.data();
            if (!data) return;

            if (data.status === 'queued' || data.status === 'processing') {
                applyQueueUpdate(data);
                return;
            }

            if (data.status === 'completed' && data.imageUrl) {
                succeedGeneration({ imageUrl: data.imageUrl as string });
                return;
            }

            if (data.status === 'failed') {
                failGeneration(
                    (data.error as string) || "Something went wrong. Your credits were returned.",
                    false
                );
            }
        }, (err) => {
            console.warn('[Lite] Gen subscription error:', err);
            failGeneration("Lost connection to the server. Please try again.", !apiAccepted);
        });

        const apiCall = httpsCallable(functions, 'api', { timeout: 120000 });
        apiCall({ 
            action: 'createGenerationRequest', 
            prompt: cleanPrompt, 
            modelId: selectedModel.id, 
            requestId, 
            ...params 
        }).then(() => {
            apiAccepted = true;
        }).catch((err: any) => {
            failGeneration(err.message || "Could not start. Please try again.");
        });
        });
    }, [currentUser, selectedModel, isOffline, loadLocal, cooldownUntil, userTier, zaps, resetGenerationUi]);

    return (
        <LiteContext.Provider value={{ 
            currentUser, availableModels, selectedModel, setSelectedModel, 
            history, localHistory, displayHistory, loading, generating, generationStage, generationProgress,
            generationPreviewUrl, activeGeneration,
            generateStartTime, generate, 
            login, signup, logout, loginWithGoogle, isOffline, userTier, zaps,
            addToast,
            modelsError
        }}>
            {children}
        </LiteContext.Provider>
    );
}