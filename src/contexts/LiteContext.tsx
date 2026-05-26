/**
 * [LAYER: INFRASTRUCTURE]
 */
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef, useMemo } from 'react';
import {
    GenerationStage,
    LONG_RUNNING_MESSAGE,
    IN_LINE_MESSAGE,
    SLOW_START_MESSAGE,
    clearPendingGeneration,
    filterDisplayableHistory,
    loadPendingGeneration,
    type PendingGeneration,
    loadLocalGenerations,
    localHistoryStorageKey,
    mergeGenerationHistory,
    matchesPendingRequest,
    messageForStage,
    monotonicProgress,
    parseCallableError,
    completePendingFromHistory,
    persistCompletedGeneration,
    preloadImage,
    releaseGenerationCompletionClaim,
    savePendingGeneration,
    tryClaimGenerationCompletion,
    scopeLocalHistoryForUser,
    smoothIdleProgress,
    toHistoryTimestamp,
} from '../lib/generationFlow';
import {
    attachGenerationSession,
    probeCompletedGeneration,
} from '../lib/generationSession';
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
import { collection, doc, getDoc, onSnapshot, query, orderBy, limit, where, setDoc, serverTimestamp, enableNetwork, disableNetwork } from 'firebase/firestore';
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
    pendingGeneration: PendingGeneration | null;
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
    const prevUidRef = useRef<string | undefined>(undefined);
    const displayHistoryRef = useRef<any[]>([]);
    const completionClaimRef = useRef<string | null>(null);
    const resumeSessionIdRef = useRef<string | null>(null);
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

    const loadLocal = useCallback(async () => {
        try {
            const gens = await loadLocalGenerations(50, currentUser?.uid);
            setLocalHistory(gens);
        } catch (err) {
            console.warn('[Lite] Local history unavailable:', err);
        }
    }, [currentUser?.uid]);

    useEffect(() => {
        if (!navigator.onLine) {
            setIsOffline(true);
            disableNetwork(db);
        }
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            enableNetwork(db);
            toast.success("Network restored");
            loadLocal();
        };
        const handleOffline = () => { setIsOffline(true); disableNetwork(db); toast.error("Offline Mode Active"); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [loadLocal]);

    useEffect(() => {
        let userUnsub: (() => void) | null = null;

        const authUnsub = onAuthStateChanged(auth, (user) => {
            userUnsub?.();
            userUnsub = null;
            setCurrentUser(user);

            if (!user) {
                setLoading(false);
                setUserTier('free');
                setZaps(10);
                return;
            }

            userUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    setUserTier(data.tier || 'free');
                    setZaps(data.zaps ?? (data.tier === 'pro' || data.tier === 'architect' ? 'unlimited' : 10));
                }
                setLoading(false);
            }, (err) => {
                console.warn('[Lite] User data fetch failed:', err);
                setLoading(false);
            });
        });

        return () => {
            authUnsub();
            userUnsub?.();
        };
    }, []);

    useEffect(() => {
        loadLocal();
    }, [currentUser?.uid, loadLocal]);

    /** Sync local history when another tab writes to localStorage */
    useEffect(() => {
        if (!currentUser?.uid) return;
        const key = localHistoryStorageKey(currentUser.uid);
        const onStorage = (e: StorageEvent) => {
            if (e.key === key) loadLocal();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [currentUser?.uid, loadLocal]);

    const selectModel = useCallback((model: AIModel) => {
        localStorage.setItem('lite_selected_model', model.id);
        setSelectedModel(model);
    }, []);

    const resetGenerationUi = useCallback(() => {
        setGenerating(false);
        setGenerationStage('idle');
        setGenerationProgress(0);
        setGenerationPreviewUrl(null);
        setActiveGeneration(null);
        setGenerateStartTime(undefined);
    }, []);

    useEffect(() => {
        const uid = currentUser?.uid;
        if (prevUidRef.current && prevUidRef.current !== uid) {
            generationSessionRef.current?.();
            generatingRef.current = false;
            clearPendingGeneration();
            resetGenerationUi();
            setLocalHistory([]);
            completionClaimRef.current = null;
            resumeSessionIdRef.current = null;
        }
        prevUidRef.current = uid;
    }, [currentUser?.uid, resetGenerationUi]);

    const displayHistory = useMemo(
        () => filterDisplayableHistory(
            mergeGenerationHistory(
                scopeLocalHistoryForUser(localHistory, currentUser?.uid),
                history
            )
        ),
        [localHistory, history, currentUser?.uid]
    );

    displayHistoryRef.current = displayHistory;

    const pendingGeneration = useMemo(
        () => loadPendingGeneration(currentUser?.uid) ?? null,
        [currentUser?.uid, displayHistory, generating, localHistory]
    );

    useEffect(() => () => { generationSessionRef.current?.(); }, []);

    /** Re-attach to an in-flight job after navigation refresh */
    useEffect(() => {
        const uid = currentUser?.uid;
        if (!uid || generatingRef.current) return;
        if (generationSessionRef.current) return;

        const pending = loadPendingGeneration(uid);
        if (!pending) return;
        if (resumeSessionIdRef.current === pending.requestId) return;

        resumeSessionIdRef.current = pending.requestId;
        generatingRef.current = true;

        let cancelled = false;
        let settled = false;
        let detach: (() => void) | null = null;

        const finish = (keepPending = false) => {
            generatingRef.current = false;
            if (!keepPending) {
                clearPendingGeneration();
                if (resumeSessionIdRef.current === pending.requestId) {
                    resumeSessionIdRef.current = null;
                }
            }
        };

        const succeedPending = async (imageUrl: string, firestoreImageId?: string) => {
            if (cancelled || settled) return;
            if (!tryClaimGenerationCompletion(completionClaimRef, pending.requestId)) return;
            settled = true;
            finish();
            let savedLocally = false;
            try {
                const entry = await persistCompletedGeneration({
                    requestId: pending.requestId,
                    prompt: pending.prompt,
                    imageUrl,
                    userId: uid,
                    firestoreImageId,
                });
                if (cancelled) return;
                setLocalHistory(prev => [entry, ...prev.filter(i => i.id !== pending.requestId)]);
                savedLocally = true;
            } catch (err) {
                console.warn('[Lite] Could not save resumed picture locally:', err);
                releaseGenerationCompletionClaim(completionClaimRef, pending.requestId);
            }
            if (cancelled) return;
            resetGenerationUi();
            detach?.();
            detach = null;
            if (savedLocally) {
                toast.success('Your picture is ready!', { id: pending.requestId });
            } else {
                toast.error('Picture finished, but could not save on this device. Check your account online.', { id: pending.requestId });
            }
            loadLocal();
        };

        (async () => {
            const inHistory = displayHistoryRef.current.find((item) =>
                matchesPendingRequest(item, pending.requestId)
            );
            if (inHistory?.imageUrl) {
                await succeedPending(
                    inHistory.imageUrl as string,
                    inHistory.firestoreImageId as string | undefined
                );
                return;
            }

            const probed = await probeCompletedGeneration(db, pending.requestId, uid);
            if (cancelled || settled) return;

            if (probed.status === 'complete') {
                await succeedPending(probed.payload.imageUrl, probed.payload.firestoreImageId);
                return;
            }
            if (probed.status === 'failed') {
                settled = true;
                finish();
                resetGenerationUi();
                toast.error(probed.message, { id: pending.requestId });
                return;
            }
            if (cancelled || settled) {
                generatingRef.current = false;
                return;
            }

            setGenerating(true);
            setGenerationStage('processing');
            setGenerationProgress(40);
            setActiveGeneration({ requestId: pending.requestId, prompt: pending.prompt });
            setGenerateStartTime(pending.startedAt);
            toast.loading('Checking on your picture…', { id: pending.requestId });

            detach = attachGenerationSession(db, {
                requestId: pending.requestId,
                startedAt: pending.startedAt,
                initialProgressFloor: 40,
                expectedUserId: uid,
                onProgress: (patch) => {
                    setGenerationStage(patch.stage);
                    setGenerationProgress(patch.progress);
                    toast.loading(patch.message, { id: pending.requestId });
                    if (patch.previewUrl) setGenerationPreviewUrl(patch.previewUrl);
                },
                onSuccess: ({ imageUrl, firestoreImageId }) => {
                    succeedPending(imageUrl, firestoreImageId);
                },
                onFailed: (message) => {
                    if (settled) return;
                    settled = true;
                    detach?.();
                    detach = null;
                    finish();
                    resetGenerationUi();
                    toast.error(message, { id: pending.requestId });
                },
                onHardTimeout: () => {
                    if (settled) return;
                    finish(true);
                    resetGenerationUi();
                    toast.error('This took too long. Check your profile — it may still finish.', { id: pending.requestId });
                },
                onConnectionError: () => {
                    if (settled) return;
                    toast.loading('Reconnecting…', { id: pending.requestId });
                },
            });

            generationSessionRef.current = () => {
                settled = true;
                detach?.();
                finish();
            };
        })();

        return () => {
            cancelled = true;
            detach?.();
            generatingRef.current = false;
            if (resumeSessionIdRef.current === pending.requestId) {
                resumeSessionIdRef.current = null;
            }
        };
    }, [currentUser?.uid, loadLocal, resetGenerationUi]);

    /** After client timeout, pending is kept — finish when cloud history delivers the image */
    useEffect(() => {
        const uid = currentUser?.uid;
        if (!uid || generating || generatingRef.current) return;

        const pending = loadPendingGeneration(uid);
        if (!pending) return;

        const match = displayHistory.find((item) =>
            matchesPendingRequest(item, pending.requestId)
        );
        if (!match?.imageUrl) return;

        completePendingFromHistory(
            completionClaimRef,
            pending,
            {
                imageUrl: match.imageUrl as string,
                firestoreImageId: match.firestoreImageId as string | undefined,
            },
            uid
        )
            .then((entry) => {
                if (!entry) return;
                clearPendingGeneration();
                if (resumeSessionIdRef.current === pending.requestId) {
                    resumeSessionIdRef.current = null;
                }
                setLocalHistory((prev) => [entry, ...prev.filter((i) => i.id !== pending.requestId)]);
                loadLocal();
                toast.success('Your picture is ready!', { id: pending.requestId });
            })
            .catch((err) => {
                console.warn('[Lite] Late completion save failed:', err);
            });
    }, [displayHistory, generating, currentUser?.uid, loadLocal]);

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

            setSelectedModel((current) => {
                if (savedModel) {
                    if (!current) return savedModel;
                    if (models.some((m) => m.id === current.id)) return current;
                    return savedModel;
                }
                return current ?? models[0];
            });
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
    }, []);

    useEffect(() => {
        const uid = currentUser?.uid;
        if (!uid) { setHistory([]); return; }

        let fallbackUnsub: (() => void) | null = null;
        let primaryUnsub: (() => void) | null = null;
        let usingFallback = false;

        const mapDocs = (docs: { id: string; data: () => Record<string, unknown> }[]) =>
            docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string }));

        const orderedQuery = query(
            collection(db, 'images'),
            where('userId', '==', uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const fallbackQuery = query(
            collection(db, 'images'),
            where('userId', '==', uid),
            limit(50)
        );

        const startFallback = () => {
            if (fallbackUnsub || usingFallback) return;
            usingFallback = true;
            primaryUnsub?.();
            primaryUnsub = null;
            fallbackUnsub = onSnapshot(
                fallbackQuery,
                snap => {
                    const items = mapDocs(snap.docs).sort(
                        (a, b) => toHistoryTimestamp(b.createdAt) - toHistoryTimestamp(a.createdAt)
                    );
                    setHistory(items);
                },
                err2 => {
                    console.warn('[Lite] History subscription failed (fallback):', err2);
                    setHistory([]);
                }
            );
        };

        primaryUnsub = onSnapshot(
            orderedQuery,
            snap => {
                if (usingFallback) return;
                setHistory(mapDocs(snap.docs));
            },
            err => {
                console.warn('[Lite] History subscription failed (ordered):', err);
                startFallback();
            }
        );

        return () => {
            primaryUnsub?.();
            fallbackUnsub?.();
        };
    }, [currentUser?.uid]);

    const upsertUserProfile = async (
        uid: string,
        fields: Record<string, unknown>,
        initializeIfMissing?: Record<string, unknown>
    ) => {
        const userRef = doc(db, 'users', uid);
        const existing = await getDoc(userRef);
        if (!existing.exists() && initializeIfMissing) {
            await setDoc(userRef, { ...initializeIfMissing, ...fields }, { merge: true });
            return;
        }
        await setDoc(userRef, fields, { merge: true });
    };

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

    const logout = () => {
        generationSessionRef.current?.();
        generatingRef.current = false;
        clearPendingGeneration();
        resetGenerationUi();
        setHistory([]);
        setLocalHistory([]);
        completionClaimRef.current = null;
        resumeSessionIdRef.current = null;
        return signOut(auth).then(() => { toast.success("Safe travels."); });
    };

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
                    await upsertUserProfile(
                        res.user.uid,
                        {
                            email: res.user.email,
                            lastLogin: serverTimestamp(),
                            platform: 'electron',
                        },
                        {
                            email: res.user.email,
                            createdAt: serverTimestamp(),
                            platform: 'electron',
                            tier: 'free',
                            zaps: 10,
                        }
                    );
                    addToast(`Welcome back, ${res.user.displayName?.split(' ')[0]}`, "success", "google-auth");
                }
            } else {
                const provider = new GoogleAuthProvider();
                const res = await signInWithPopup(auth, provider);
                if (res.user) {
                    await upsertUserProfile(
                        res.user.uid,
                        {
                            email: res.user.email,
                            lastLogin: serverTimestamp(),
                        },
                        {
                            email: res.user.email,
                            createdAt: serverTimestamp(),
                            tier: 'free',
                            zaps: 10,
                        }
                    );
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

        const uid = auth.currentUser?.uid;
        if (!uid || !selectedModel) { toast.error("Identity unknown. Please sign in."); return Promise.resolve(false); }

        const existingPending = loadPendingGeneration(uid);
        if (existingPending) {
            toast.error(
                'You still have a picture in progress. Check your profile — it may finish soon.',
                { id: existingPending.requestId }
            );
            return Promise.resolve(false);
        }
        
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
        let promiseResolved = false;
        const safeResolve = (value: boolean) => {
            if (promiseResolved) return;
            promiseResolved = true;
            resolve(value);
        };

        generatingRef.current = true;
        const estimatedCost = calculateEstimatedCost(selectedModel.id, userTier);
        const requestId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const startedAt = Date.now();

        generationSessionRef.current?.();
        completionClaimRef.current = null;

        setGenerating(true);
        setGenerationStage('submitting');
        setGenerationProgress(10);
        setGenerationPreviewUrl(null);
        setActiveGeneration({ requestId, prompt: cleanPrompt });
        setGenerateStartTime(startedAt);
        savePendingGeneration({
            requestId,
            prompt: cleanPrompt,
            startedAt,
            userId: uid,
        });
        toast.loading(messageForStage('submitting'), { id: requestId });

        if (typeof zaps === 'number' && estimatedCost > 0) {
            setZaps(prev => typeof prev === 'number' ? Math.max(0, prev - estimatedCost) : prev);
        }

        let jobUnsub: (() => void) | null = null;
        let idleTick: ReturnType<typeof setInterval> | null = null;
        const softTimeoutIds: ReturnType<typeof setTimeout>[] = [];
        let settled = false;
        let apiAccepted = false;
        let sawQueueDoc = false;
        let progressFloor = 10;
        let lastToastMessage = messageForStage('submitting');

        const rollbackCredits = () => {
            if (estimatedCost > 0) {
                setZaps(prev => typeof prev === 'number' ? prev + estimatedCost : prev);
            }
        };

        const finishSession = (options?: { keepPending?: boolean; keepListener?: boolean }) => {
            softTimeoutIds.forEach(clearTimeout);
            if (idleTick) clearInterval(idleTick);
            idleTick = null;
            if (!options?.keepListener && jobUnsub) {
                jobUnsub();
                jobUnsub = null;
            }
            generatingRef.current = false;
            if (!options?.keepPending) clearPendingGeneration();
            if (generationSessionRef.current === finishSession && !options?.keepListener) {
                generationSessionRef.current = null;
            }
        };

        const failGeneration = (message: string, rollback = !apiAccepted, keepPending = false) => {
            if (settled) return;
            settled = true;
            finishSession({ keepPending });
            if (rollback) rollbackCredits();
            resetGenerationUi();
            toast.error(message, { id: requestId });
            setConsecutiveFailures(prev => {
                const next = prev + 1;
                if (next >= 3) setCooldownUntil(Date.now() + 120000);
                return next;
            });
            safeResolve(false);
        };

        const succeedGeneration = async (data: { imageUrl: string; firestoreImageId?: string }) => {
            if (settled) return;
            if (!tryClaimGenerationCompletion(completionClaimRef, requestId)) return;
            settled = true;
            finishSession();
            setGenerationProgress(100);

            let savedLocally = false;
            try {
                const entry = await persistCompletedGeneration({
                    requestId,
                    prompt: cleanPrompt,
                    imageUrl: data.imageUrl,
                    userId: uid,
                    modelId: selectedModel.id,
                    params,
                    firestoreImageId: data.firestoreImageId,
                });
                setLocalHistory(prev => [entry, ...prev.filter(i => i.id !== requestId)]);
                savedLocally = true;
            } catch (err) {
                console.warn('[Lite] Could not save picture locally:', err);
                releaseGenerationCompletionClaim(completionClaimRef, requestId);
            }

            resetGenerationUi();
            if (savedLocally) {
                toast.success("Your picture is ready!", { id: requestId });
            } else {
                toast.error('Picture finished, but could not save on this device. Check your account online.', { id: requestId });
            }
            setConsecutiveFailures(0);
            
            loadLocal();
            safeResolve(true);
        };

        generationSessionRef.current = finishSession;

        idleTick = setInterval(() => {
            if (settled || sawQueueDoc) return;
            progressFloor = smoothIdleProgress(progressFloor);
            setGenerationProgress(progressFloor);
        }, 700);

        softTimeoutIds.push(
            setTimeout(() => {
                if (settled || sawQueueDoc) return;
                if (apiAccepted) {
                    progressFloor = monotonicProgress(progressFloor, 32);
                    setGenerationProgress(progressFloor);
                    lastToastMessage = IN_LINE_MESSAGE;
                    toast.loading(IN_LINE_MESSAGE, { id: requestId });
                } else {
                    lastToastMessage = SLOW_START_MESSAGE;
                    toast.loading(SLOW_START_MESSAGE, { id: requestId });
                }
            }, 8000),
            setTimeout(() => {
                if (!settled) toast.loading(LONG_RUNNING_MESSAGE, { id: requestId });
            }, 60000),
            setTimeout(() => {
                if (!settled) toast.loading(LONG_RUNNING_MESSAGE, { id: requestId });
            }, 120000)
        );

        jobUnsub = attachGenerationSession(db, {
            requestId,
            startedAt,
            initialProgressFloor: progressFloor,
            expectedUserId: uid,
            onProgress: (patch) => {
                sawQueueDoc = true;
                progressFloor = patch.progress;
                setGenerationStage(patch.stage);
                setGenerationProgress(patch.progress);

                if (patch.message !== lastToastMessage) {
                    lastToastMessage = patch.message;
                    toast.loading(patch.message, { id: requestId });
                }

                if (patch.previewUrl) {
                    setGenerationPreviewUrl(patch.previewUrl);
                    if (!patch.previewUrl.startsWith('data:')) {
                        preloadImage(getOptimizedImageUrl(patch.previewUrl) || patch.previewUrl);
                    }
                }
            },
            onSuccess: (payload) => {
                succeedGeneration(payload);
            },
            onFailed: (message) => {
                failGeneration(
                    message || "Something went wrong. Your credits were returned.",
                    false
                );
            },
            onHardTimeout: () => {
                if (settled) return;
                finishSession({ keepPending: true, keepListener: true });
                resetGenerationUi();
                toast.error('This took too long. Check your profile — it may still finish.', { id: requestId });
                safeResolve(false);
            },
            onConnectionError: () => {
                if (settled) return;
                toast.loading('Reconnecting…', { id: requestId });
            },
        });

        const apiCall = httpsCallable(functions, 'api', { timeout: 120000 });
        apiCall({ 
            action: 'createGenerationRequest', 
            prompt: cleanPrompt, 
            modelId: selectedModel.id, 
            requestId, 
            ...params 
        }).then(() => {
            if (settled) return;
            apiAccepted = true;
            progressFloor = monotonicProgress(progressFloor, 28);
            setGenerationStage('queued');
            setGenerationProgress(progressFloor);
            if (lastToastMessage !== messageForStage('queued')) {
                lastToastMessage = messageForStage('queued');
                toast.loading(lastToastMessage, { id: requestId });
            }
        }).catch((err: unknown) => {
            failGeneration(parseCallableError(err));
        });
        });
    }, [currentUser?.uid, selectedModel, isOffline, loadLocal, cooldownUntil, userTier, zaps, resetGenerationUi]);

    return (
        <LiteContext.Provider value={{ 
            currentUser, availableModels, selectedModel, setSelectedModel: selectModel, 
            history, localHistory, displayHistory, loading, generating, generationStage, generationProgress,
            generationPreviewUrl, activeGeneration, pendingGeneration,
            generateStartTime, generate, 
            login, signup, logout, loginWithGoogle, isOffline, userTier, zaps,
            addToast,
            modelsError
        }}>
            {children}
        </LiteContext.Provider>
    );
}