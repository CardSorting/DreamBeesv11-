import React from 'react';

/**
 * A wrapper for React.lazy() that reloads the page if the import fails.
 * This handles the "Failed to fetch dynamically imported module" error common in
 * SPAs after a new deployment.
 *
 * @param {Function} importFn - The dynamic import function, e.g. () => import('./MyComponent')
 * @returns {React.Component} - The lazy loaded component
 */
export const lazyRetry = (importFn) => {
    return React.lazy(() => {
        return importFn()
            .then((module) => {
                // SUCCESS: Clear the reload timestamp so we can retry again if it fails in the future
                window.sessionStorage.removeItem('retry-lazy-last-refresh');
                return module;
            })
            .catch((error) => {
                // Get the last reload timestamp
                const lastRefresh = window.sessionStorage.getItem('retry-lazy-last-refresh');
                const now = Date.now();

                // If we haven't reloaded in the last 10 seconds, try reloading
                // This handles deployment propagation delays without infinite loops
                if (!lastRefresh || (now - parseInt(lastRefresh, 10)) > 10000) {
                    // Mark the reload time
                    window.sessionStorage.setItem('retry-lazy-last-refresh', now.toString());

                    console.warn('[lazyRetry] Chunk load failed. Reloading page to fetch fresh chunks...', error);

                    // Reload the page to get the new index.html which points to valid chunks
                    window.location.reload();

                    // Return a promise that never resolves
                    return new Promise(() => { });
                }

                // If we already reloaded recently and it still fails, bubble up
                console.error('[lazyRetry] Chunk load failed even after recent reload.', error);
                throw error;
            });
    });
};
