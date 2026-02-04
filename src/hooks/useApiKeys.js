import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const API_URL = "https://dreambeesai.com/api";

export function useApiKeys() {
    const { currentUser } = useAuth();
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const callApi = useCallback(async (action, payload = {}) => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    data: { action, ...payload }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const msg = data.error?.message || response.statusText;
                throw new Error(msg);
            }

            return data.result;

        } catch (err) {
            console.error("API Key Error:", err);
            setError(err.message);
            toast.error(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const fetchKeys = useCallback(async () => {
        try {
            const result = await callApi('listApiKeys');
            if (result && result.keys) {
                setKeys(result.keys);
            }
        } catch {
            // Error handled in callApi
        }
    }, [callApi]);

    const createKey = useCallback(async (name, scope = ['default']) => {
        try {
            const result = await callApi('createApiKey', { name, scope });
            if (result.success) {
                toast.success("API Key Created!");
                // Refresh list
                await fetchKeys();
                return result; // return full result so UI can show the raw key
            }
        } catch {
            // Error handled in callApi
        }
    }, [callApi, fetchKeys]);

    const revokeKey = useCallback(async (keyId) => {
        try {
            await callApi('revokeApiKey', { keyId });
            toast.success("API Key Revoked");
            // Optimistic update
            setKeys(prev => prev.filter(k => k.id !== keyId));
        } catch {
            // Error handled
        }
    }, [callApi]);

    return {
        keys,
        loading,
        error,
        fetchKeys,
        createKey,
        revokeKey
    };
}
