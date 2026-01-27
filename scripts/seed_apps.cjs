
const admin = require('firebase-admin');
// serviceAccountKey.json is in the root, so from scripts/ it is ../serviceAccountKey.json
// But usually scripts run from root, so we check path.
// Based on seed_models.cjs in functions/, let's assume this script is run from root or adapts.
// Let's rely on standard admin SDK usage if available or try to require serviceAccountKey if we are running locally.

const serviceAccount = require('../functions/alchemistServiceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const APPS = [
    {
        id: "magic-wardrobe",
        title: "Magic Wardrobe",
        description: "Try on digital outfits instantly. Your style, reimagined.",
        icon: "Sparkles",
        path: "/dressup",
        color: "pink",
        tags: ["Lifestyle"],
        rating: "4.8",
        order: 2
    },
    {
        id: "story-slides",
        title: "Story Slides",
        description: "Turn ideas into beautiful presentations in seconds.",
        icon: "Presentation",
        path: "/slideshow",
        color: "mint",
        tags: ["Productivity"],
        rating: "4.7",
        order: 3
    },
    {
        id: "dream-canvas",
        title: "Dream Canvas",
        description: "Generative art for everyone. Sketch, dream, and create.",
        icon: "Palette",
        path: "/generate",
        color: "sky",
        tags: ["Art & Design"],
        rating: "4.6",
        order: 4
    },
    {
        id: "pixel-sprite",
        title: "Pixel Sprite",
        description: "Make retro game assets for your next adventure.",
        icon: "Gamepad2",
        path: "/generate",
        color: "indigo",
        tags: ["Game Dev"],
        rating: "4.9",
        order: 5
    },
    {
        id: "icon-gen",
        title: "Icon Gen",
        description: "Create app icons with AI.",
        icon: "LayoutGrid",
        path: "/generate",
        color: "rose",
        tags: ["Design"],
        rating: "4.8",
        order: 7
    },
    {
        id: "code-assistant",
        title: "Code Assistant",
        description: "Debug your code with a smile.",
        icon: "Zap",
        path: "/",
        color: "blue",
        tags: ["Dev"],
        rating: "4.9",
        order: 8
    },
    {
        id: "video-editor",
        title: "Video Editor",
        description: "Edit videos like a pro directly in browser.",
        icon: "LayoutGrid",
        path: "/generate",
        color: "violet",
        tags: ["Video"],
        rating: "4.7",
        order: 9
    },
    {
        id: "note-master",
        title: "Note Master",
        description: "Keep your thoughts organized.",
        icon: "Presentation",
        path: "/",
        color: "amber",
        tags: ["Productivity"],
        rating: "4.6",
        order: 10
    },
    {
        id: "dev-tools",
        title: "Dev Tools",
        description: "Essential utilities for developers.",
        icon: "Zap",
        path: "/",
        color: "indigo",
        tags: ["Dev"],
        rating: "4.9",
        order: 12
    }
];

async function seedApps() {
    const collectionRef = db.collection('apps');

    console.log(`Starting seed of ${APPS.length} apps...`);

    for (const app of APPS) {
        // Use custom ID
        const docRef = collectionRef.doc(app.id);

        // Always overwrite for this seed to ensure consistency with code
        await docRef.set(app, { merge: true });
        console.log(`✓ Seeded app: ${app.title} (${app.id})`);
    }

    console.log('Seed complete.');
}

seedApps().catch(console.error);
