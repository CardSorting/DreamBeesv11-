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
        return importFn().catch((error) => {
            // Check if we already tried reloading
            const hasReloaded = window.sessionStorage.getItem('retry-lazy-refreshed');

            if (!hasReloaded) {
                // Mark that we are reloading to avoid infinite loops
                window.sessionStorage.setItem('retry-lazy-refreshed', 'true');

                console.warn('[lazyRetry] Chunk load failed. Reloading page to fetch fresh chunks...', error);

                // Reload the page to get the new index.html which points to valid chunks
                window.location.reload();

                // Return a promise that never resolves (so the error boundary doesn't trigger immediately before reload)
                return new Promise(() => { });
            }

            // If we already reloaded and it still fails, let the error bubble up to the ErrorBoundary
            console.error('[lazyRetry] Chunk load failed even after reload.', error);
            throw error;
        });
    });
};
