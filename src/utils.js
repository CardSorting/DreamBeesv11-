
export const getOptimizedImageUrl = (url) => {
    if (!url) return url;
    // Check if it's a raw Backblaze B2 public URL
    // We replace the specific bucket path to the CDN root
    if (url.includes('f005.backblazeb2.com/file/printeregg')) {
        return url.replace('https://f005.backblazeb2.com', 'https://cdn.dreambeesai.com');
    }
    return url;
};
