import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '../firebase.ts';
import { 
    onAuthStateChanged, 
    User, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    GoogleAuthProvider, 
    signInWithPopup 
} from 'firebase/auth';
import { collection, doc, onSnapshot, query, orderBy, limit, setDoc, serverTimestamp, enableNetwork, disableNetwork } from 'firebase/firestore';
import { AIModel } from '../lite-utils';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'loading';
}

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
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type'], id?: string) => string;
    removeToast: (id: string) => void;
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
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type'] = 'success', existingId?: string) => {
        const id = existingId || Math.random().toString(36).substring(7);
        setToasts(prev => {
            const filtered = prev.filter(t => t.id !== id);
            return [...filtered, { id, message, type }];
        });
        if (type !== 'loading') {
            setTimeout(() => removeToast(id), 4000);
        }
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        const handleOnline = () => { setIsOffline(false); enableNetwork(db); };
        const handleOffline = () => { setIsOffline(true); disableNetwork(db); };
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
        window.electronAPI?.lite.health()
            .then(health => console.info('[Lite] Electron bridge health:', health))
            .catch(err => console.warn('[Lite] Electron bridge unavailable:', err));
    }, []);

    useEffect(() => {
        const modelsQuery = query(collection(db, 'models'), orderBy('order', 'asc'), limit(20));
        return onSnapshot(modelsQuery, snap => {
            const models = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIModel));
            setAvailableModels(models);
            if (models.length > 0 && !selectedModel) {
                const savedId = localStorage.getItem('lite_selected_model');
                setSelectedModel(models.find(m => m.id === savedId) || models[0]);
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

    const logout = () => signOut(auth);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        if (res.user) {
            await setDoc(doc(db, 'users', res.user.uid), {
                email: res.user.email,
                lastLogin: serverTimestamp()
            }, { merge: true });
        }
    };

    const generate = useCallback(async (prompt: string, params: any = {}) => {
        if (isOffline) { addToast("Offline: Internet required", "error"); return; }
        if (!currentUser || !selectedModel) return;
        setGenerating(true);
        const requestId = `gen_${Date.now()}`;
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch('https://api.dreambeesai.com/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'createGenerationRequest', prompt, modelId: selectedModel.id, requestId, ...params })
            });
            if (!res.ok) throw new Error("Request failed");
            addToast("Generating...", "loading", requestId);
            
            const unsub = onSnapshot(doc(db, 'generation_queue', requestId), async (snap) => {
                const data = snap.data();
                if (data?.status === 'completed' && data.imageUrl) {
                    addToast("Vision complete!", "success", requestId);
                    setGenerating(false);
                    if (window.electronAPI?.lite) {
                        try {
                            await window.electronAPI.lite.saveGeneration({
                                id: requestId,
                                prompt,
                                imageUrl: data.imageUrl,
                                modelId: selectedModel.id,
                                params,
                                createdAt: Date.now()
                            });
                            loadLocal();
                        } catch (err) {
                            console.warn('[Lite] Failed to persist local generation:', err);
                        }
                    }
                    unsub();
                } else if (data?.status === 'failed') {
                    addToast(data.error || "Failed", "error", requestId);
                    setGenerating(false);
                    unsub();
                }
            }, err => {
                console.warn('[Lite] Generation subscription failed:', err);
                addToast('Generation status unavailable', 'error', requestId);
                setGenerating(false);
            });
        } catch (err: any) {
            addToast(err.message, "error", requestId);
            setGenerating(false);
        }
    }, [currentUser, selectedModel, isOffline, loadLocal, addToast]);

    return (
        <LiteContext.Provider value={{ 
            currentUser, availableModels, selectedModel, setSelectedModel, 
            history, localHistory, loading, generating, generate, 
            login, signup, logout, loginWithGoogle, isOffline,
            toasts, addToast, removeToast
        }}>
            {children}
            {/* Custom Toast UI */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        {t.message}
                    </div>
                ))}
            </div>
            <style>{`
                .toast-container { position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; }
                .toast { padding: 12px 24px; border-radius: 12px; background: #18181b; color: white; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-size: 0.9rem; animation: slideIn 0.3s ease-out; }
                .toast.error { border-color: #ef4444; color: #fca5a5; }
                .toast.loading { border-color: #8b5cf6; }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>
        </LiteContext.Provider>
    );
}
