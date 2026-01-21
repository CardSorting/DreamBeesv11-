
// Run this with: node scripts/seed_memes.js
// Ensure GOOGLE_APPLICATION_CREDENTIALS is set or you are logged in via gcloud if running locally.
import { initializeApp, cert } from "firebase-admin/app"; // Or applicationDefault if running in environment with credentials
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from 'fs/promises';

async function seed() {
    console.log("Initializing Firebase Admin...");

    // Attempting to auto-discover credentials or use application default
    // Note: If running locally without env vars, this might fail unless authenticated via `gcloud auth application-default login`
    const app = initializeApp({
        projectId: "dreambees-alchemist"
    });

    const db = getFirestore(app);

    console.log("Seeding 'memes' collection...");

    const dummyMeme = {
        userId: "system_seed",
        prompt: "When the code works on the first try",
        aspectRatio: "1:1",
        modelId: "gemini-2.5-flash-image",
        imageUrl: "https://storage.googleapis.com/dreambees-public/assets/meme_placeholder.png", // Using a placeholder or valid URL
        thumbnailUrl: "https://storage.googleapis.com/dreambees-public/assets/meme_placeholder_thumb.png",
        lqip: "data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAADwAQCdASoFAAUAAUAmJaQAA3AA/v89WAAAAA==",
        createdAt: new Date(),
        type: "meme",
        seed: true
    };

    try {
        const res = await db.collection("memes").add(dummyMeme);
        console.log(`Successfully added seed document with ID: ${res.id}`);
    } catch (error) {
        console.error("Error seeding database:", error);
    }
}

seed();
