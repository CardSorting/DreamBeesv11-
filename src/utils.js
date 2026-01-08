
export const getOptimizedImageUrl = (url) => {
    if (!url) return url;

    // Handle relative URLs - if they're showcase images, they should stay relative
    // Otherwise, ensure they're absolute URLs
    if (typeof url !== 'string') return url;

    // Already a CDN URL - ensure it has the correct bucket path
    if (url.startsWith('https://cdn.dreambeesai.com')) {
        // Fix malformed CDN URLs that are missing the bucket path
        if (url.startsWith('https://cdn.dreambeesai.com/generated/')) {
            return url.replace('https://cdn.dreambeesai.com/generated/', 'https://cdn.dreambeesai.com/file/printeregg/generated/');
        }
        // If it's already correct, return as-is
        if (url.includes('/file/printeregg/')) {
            return url;
        }
        // If it's a showcase path, keep it as CDN
        if (url.includes('/showcase/')) {
            return url;
        }
        return url;
    }

    // Check if it's a raw Backblaze B2 public URL - convert to CDN
    if (url.includes('backblazeb2.com')) {
        // Replace any B2 endpoint with CDN
        const b2Pattern = /https?:\/\/[^/]+\.backblazeb2\.com\//;
        if (b2Pattern.test(url)) {
            return url.replace(b2Pattern, 'https://cdn.dreambeesai.com/file/printeregg/');
        }
        // Handle specific B2 bucket paths
        if (url.includes('f005.backblazeb2.com/file/printeregg')) {
            return url.replace('https://f005.backblazeb2.com', 'https://cdn.dreambeesai.com');
        }
    }

    // Check if it's a B2 public URL without the file path
    if (url.includes('backblazeb2.com') && !url.includes('/file/')) {
        // Extract the path and prepend the bucket
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        return `https://cdn.dreambeesai.com/file/printeregg${path}`;
    }

    // For generated images that might be in B2, ensure CDN
    if (url.includes('/generated/') && !url.includes('cdn.dreambeesai.com') && !url.startsWith('/')) {
        // This might be a B2 URL, try to convert
        if (url.includes('http')) {
            // Extract path after domain
            try {
                const urlObj = new URL(url);
                const path = urlObj.pathname;
                if (path.includes('/generated/')) {
                    return `https://cdn.dreambeesai.com/file/printeregg${path}`;
                }
            } catch {
                // Invalid URL, return as-is
            }
        }
    }

    // Return relative URLs as-is (for local showcase images)
    if (url.startsWith('/')) {
        return url;
    }

    return url;
};

/**
 * Generates LCP-optimized attributes for an image based on its index
 * @param {number} index - The position of the image in a grid
 * @param {number} threshold - Number of items to prioritize (default 4)
 */
export const getLCPAttributes = (index, threshold = 4) => {
    const isPriority = index < threshold;
    return {
        loading: isPriority ? "eager" : "lazy",
        fetchPriority: isPriority ? "high" : "auto",
        decoding: isPriority ? "sync" : "async"
    };
};

/**
 * Generates a srcset string for an image if a thumbnail is available
 */
export const getImageSrcSet = (img) => {
    if (!img || !img.imageUrl) return undefined;
    if (img.thumbnailUrl) {
        return `${getOptimizedImageUrl(img.thumbnailUrl)} 512w, ${getOptimizedImageUrl(img.imageUrl)} 1024w`;
    }
    return undefined;
};

/**
 * Programmatically injects a preload link into the head
 * @param {string} url - The URL to preload
 * @param {string} priority - The fetch priority ('high', 'low', 'auto')
 */
export const preloadImage = (url, priority = 'auto') => {
    if (!url || typeof document === 'undefined') return;

    // Check if already preloaded
    if (document.querySelector(`link[href="${url}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    if (priority !== 'auto') {
        link.setAttribute('fetchpriority', priority);
    }
    document.head.appendChild(link);
};