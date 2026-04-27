import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '../firebase.ts';
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
import { collection, doc, onSnapshot, query, orderBy, limit, setDoc, serverTimestamp, enableNetwork, disableNetwork } from 'firebase/firestore';
import { AIModel } from '../lite-utils';
import toast from 'react-hot-toast';

interface LiteContextType {
    currentUser: User | null;
    availableModels: AIModel[];
    selectedModel: AIModel | null;
    setSelectedModel: (model: AIModel) => void;
    history: any[];
    localHistory: any[];
    loading: boolean;
    generating: boolean;
    generate: (prompt: string, params?: any) => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    signup: (email: string, pass: string, birthday: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    isOffline: boolean;
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
    const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [localHistory, setLocalHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
            setLoading(false);
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
        const modelsQuery = query(collection(db, 'models'), orderBy('order', 'asc'), limit(12));
        return onSnapshot(modelsQuery, snap => {
            const models = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIModel));
            setAvailableModels(models);
            
            if (models.length > 0) {
                const savedId = localStorage.getItem('lite_selected_model');
                const savedModel = models.find(m => m.id === savedId);
                
                if (savedModel && (!selectedModel || selectedModel.id !== savedModel.id)) {
                    setSelectedModel(savedModel);
                } else if (!selectedModel) {
                    setSelectedModel(models[0]);
                }
            }
        }, err => {
            console.warn('[Lite] Model subscription failed:', err);
            setAvailableModels([]);
        });
    }, [selectedModel]);

    useEffect(() => {
        if (!currentUser) { setHistory([]); return; }
        const q = query(collection(db, 'images'), orderBy('createdAt', 'desc'), limit(50));
        return onSnapshot(q, snap => setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))), err => {
            console.warn('[Lite] History subscription failed:', err);
            setHistory([]);
        });
    }, [currentUser]);

    const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass).then(() => {});
    
    const signup = async (email: string, pass: string, birthday: string) => {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        if (res.user) {
            await setDoc(doc(db, 'users', res.user.uid), {
                email,
                birthday,
                createdAt: serverTimestamp(),
                zaps: 10
            });
        }
    };

    const logout = () => signOut(auth).then(() => { toast.success("Safe travels."); });

    const loginWithGoogle = async () => {
        try {
            console.log("[Lite Auth] Version 1.1.2. Electron API:", Boolean(window.electronAPI?.lite?.googleLogin));
            const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
            const hasNativeLogin = Boolean(window.electronAPI?.lite?.googleLogin);
            
            if (isElectron && hasNativeLogin) {
                // Electron Native Flow (Local Bridge)
                addToast("Establishing secure link...", "loading", "google-auth");
                
                // Structured response from hardened main process (v1.3.0)
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
                        platform: 'electron'
                    }, { merge: true });
                    addToast(`Welcome back, ${res.user.displayName?.split(' ')[0]}`, "success", "google-auth");
                }
            } else {
                // Web Fallback
                const provider = new GoogleAuthProvider();
                const res = await signInWithPopup(auth, provider);
                if (res.user) {
                    await setDoc(doc(db, 'users', res.user.uid), {
                        email: res.user.email,
                        lastLogin: serverTimestamp()
                    }, { merge: true });
                    toast.success(`Welcome back, ${res.user.displayName?.split(' ')[0]}`);
                }
            }
        } catch (err: any) {
            console.error('[Lite Auth Error]', err);
            toast.error(err.message || "The vision was interrupted.");
        }
    };

    const generate = useCallback(async (prompt: string, params: any = {}) => {
        const cleanPrompt = prompt?.trim();
        if (!cleanPrompt) return;
        if (isOffline) { toast.error("The garden requires a connection to bloom."); return; }
        if (!currentUser || !selectedModel) { toast.error("Identity unknown. Please sign in."); return; }
        
        setGenerating(true);
        const requestId = `gen_${Date.now()}`;
        const toastId = toast.loading("Invoking the latent space...", { id: requestId });
        const controller = new AbortController();

        const timeoutId = setTimeout(() => {
            controller.abort();
            setGenerating(false);
            toast.error("The vision is taking too long to manifest.", { id: requestId });
        }, 90000);

        try {
            const token = await currentUser.getIdToken(true);
            
            // PRODUCTION HARDENING: Exponential Backoff Retry System
            const fetchWithRetry = async (url: string, options: any, retries = 3, backoff = 1000): Promise<Response> => {
                try {
                    const res = await fetch(url, options);
                    if (!res.ok && retries > 0 && res.status >= 500) {
                        console.warn(`[Lite Gen] Engine busy (${res.status}), retrying in ${backoff}ms...`);
                        await new Promise(r => setTimeout(r, backoff));
                        return fetchWithRetry(url, options, retries - 1, backoff * 2);
                    }
                    return res;
                } catch (err: any) {
                    if (retries > 0 && err.name !== 'AbortError') {
                        console.warn(`[Lite Gen] Network hiccup, retrying in ${backoff}ms...`, err);
                        await new Promise(r => setTimeout(r, backoff));
                        return fetchWithRetry(url, options, retries - 1, backoff * 2);
                    }
                    throw err;
                }
            };

            const res = await fetchWithRetry('https://api.dreambeesai.com/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    action: 'createGenerationRequest', 
                    prompt: cleanPrompt, 
                    modelId: selectedModel.id, 
                    requestId, 
                    ...params 
                }),
                signal: controller.signal
            });
            
            if (!res.ok) throw new Error("The engine failed to respond.");
            
            const unsub = onSnapshot(doc(db, 'generation_queue', requestId), async (snap) => {
                const data = snap.data();
                if (data?.status === 'completed' && data.imageUrl) {
                    clearTimeout(timeoutId);
                    toast.success("Vision materialized.", { id: requestId });
                    setGenerating(false);
                    if (window.electronAPI?.lite) {
                        try {
                            await window.electronAPI.lite.saveGeneration({
                                id: requestId,
                                prompt: cleanPrompt,
                                imageUrl: data.imageUrl,
                                modelId: selectedModel.id,
                                params,
                                createdAt: Date.now()
                            });
                            loadLocal();
                        } catch (err) {
                            console.warn('[Lite] Local save skipped:', err);
                        }
                    }
                    unsub();
                } else if (data?.status === 'failed') {
                    clearTimeout(timeoutId);
                    toast.error(data.error || "The manifestation failed.", { id: requestId });
                    setGenerating(false);
                    unsub();
                }
            }, err => {
                console.warn('[Lite] Gen subscription error:', err);
                clearTimeout(timeoutId);
                setGenerating(false);
            });
        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name !== 'AbortError') {
                toast.error(err.message, { id: requestId });
            }
            setGenerating(false);
        }
    }, [currentUser, selectedModel, isOffline, loadLocal]);

    return (
        <LiteContext.Provider value={{ 
            currentUser, availableModels, selectedModel, setSelectedModel, 
            history, localHistory, loading, generating, generate, 
            login, signup, logout, loginWithGoogle, isOffline,
            addToast
        }}>
            {children}
        </LiteContext.Provider>
    );
}
