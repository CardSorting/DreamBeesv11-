import { openDB } from 'idb';

const DB_NAME = 'colorcraft-db';
const STORE_NAME = 'images';

// Initialize the database
export const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
};

// Save or update a single image
export const saveImage = async (image) => {
    try {
        const db = await initDB();
        await db.put(STORE_NAME, image);
        // Also consider syncing to FireStore here if we wanted persistent user history across devices,
        // but sticking to local-first for now as per plan.
    } catch (error) {
        console.error("Failed to save image to IndexedDB:", error);
    }
};

// Delete an image by ID
export const deleteImage = async (id) => {
    try {
        const db = await initDB();
        await db.delete(STORE_NAME, id);
    } catch (error) {
        console.error("Failed to delete image from IndexedDB:", error);
    }
};

// Load all images, sorting by newest first
export const loadImages = async () => {
    try {
        const db = await initDB();
        const images = await db.getAll(STORE_NAME);

        // Sort by creation time (newest first)
        return images.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error("Failed to load images from IndexedDB:", error);
        return [];
    }
};

// Clear all 'pending' images (optional utility)
export const clearPendingImages = async () => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const images = await store.getAll();

        for (const img of images) {
            if (img.status === 'pending') {
                await store.delete(img.id);
            }
        }
        await tx.done;
    } catch (error) {
        console.error("Failed to clear pending images", error);
    }
}
