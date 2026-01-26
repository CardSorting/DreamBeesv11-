import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import toast from 'react-hot-toast';
import { trackEvent } from '../utils/analytics';

/**
 * Custom hook for resilient Cloud Function calls.
 * Handles timeouts, retries, and standardized error messages.
 */
export function useApi() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const call = useCallback(async (functionName, data = {}, options = {}) => {
        const {
            retries = 1,
            timeout = 60000, // 60s default timeout
            toastErrors = true,
            toastSuccess = false,
            successMessage = "Success!"
        } = options;

        setLoading(true);
        setError(null);

        let attempt = 0;

        while (attempt <= retries) {
            try {
                // Create a promise that rejects after timeout
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Request timed out')), timeout);
                });

                // The actual function call
                const apiFunction = httpsCallable(functions, functionName, { timeout: timeout });
                const functionPromise = apiFunction(data);

                // Race against timeout
                const result = await Promise.race([functionPromise, timeoutPromise]);

                if (toastSuccess) {
                    toast.success(successMessage);
                }

                setLoading(false);
                return result;

            } catch (err) {
                attempt++;
                console.warn(`[useApi] Call '${functionName}' failed (Attempt ${attempt}/${retries + 1}):`, err);

                // Check if we should retry (only on network/unknown errors, not logic errors)
                const isRetryable =
                    err.code === 'unavailable' ||
                    err.code === 'deadline-exceeded' ||
                    err.message.includes('network') ||
                    err.message.includes('timed out');

                if (attempt > retries || !isRetryable) {
                    setLoading(false);
                    setError(err);

                    trackEvent('api_failure', {
                        function_name: functionName,
                        error_code: err.code,
                        error_message: err.message
                    });

                    // Standardized Error Handling
                    let displayMessage = "Something went wrong.";

                    if (err.message.includes('Insufficient Zaps') || err.message.includes('resource-exhausted')) {
                        displayMessage = "Not enough Zaps! ⚡";
                        if (toastErrors) toast(displayMessage, { icon: '⚡' });
                        throw err; // Re-throw so component knows
                    } else if (err.code === 'unauthenticated') {
                        displayMessage = "Please sign in again.";
                        if (toastErrors) toast.error(displayMessage);
                    } else if (err.code === 'deadline-exceeded' || err.message.includes('timed out')) {
                        displayMessage = "The request took too long. Please try again.";
                        if (toastErrors) toast.error(displayMessage);
                    } else {
                        displayMessage = err.message || "Unknown error occurred.";
                        if (toastErrors) toast.error(displayMessage);
                    }

                    throw err; // Re-throw to caller for specific handling
                }

                // Exponential Backoff before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
            }
        }
    }, []);

    return { call, loading, error };
}
