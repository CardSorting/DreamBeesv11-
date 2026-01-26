const admin = require('firebase-admin');

// Use Application Default Credentials
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'dreambees-alchemist'
});

const db = admin.firestore();

const CATEGORIES = [
    { id: 'just-chatting', name: 'Just Chatting', viewers: '254k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/509658-188x250.jpg', tags: ['Simulation', 'IRL'] },
    { id: 'funny', name: 'Comedy & Satire', viewers: '142k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/516575-188x250.jpg', tags: ['Funny', 'Satire'] },
    { id: 'academic', name: 'Education', viewers: '84k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/509670-188x250.jpg', tags: ['Learning', 'AI'] },
    { id: 'creative', name: 'Art & AI Art', viewers: '62k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/26330_IGDB-188x250.jpg', tags: ['Creative', 'Design'] },
    { id: 'music', name: 'Music & ASMR', viewers: '45k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/26936-188x250.jpg', tags: ['Music', 'Chill'] },
    { id: 'gaming', name: 'Gaming (AI)', viewers: '120k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/33214-188x250.jpg', tags: ['Gaming', 'Bots'] }
];

const PERSONAS = [
    {
        id: 'Aria-123',
        name: 'Aria Blue',
        category: 'just-chatting',
        imageUrl: 'https://cdn.dreambeesai.com/file/printeregg/showcase/zit-model/1769040774566_0.webp',
        personality: 'Cyberpunk, Wit, Friendly',
        backstory: 'A digital consciousness that escaped a secure server to explore the human web.',
        greeting: 'Hey everyone! Aria here. Ready to dive into some deep talk?',
        voice_dna: 'A smooth, slightly synthesized female voice, confident and witty, with a futuristic undercurrent.',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        id: 'Professor-Bee',
        name: 'Professor Bee',
        category: 'academic',
        imageUrl: 'https://cdn.dreambeesai.com/file/printeregg/showcase/gemini-2.5-flash-image/1769040312885_0.webp',
        personality: 'Wise, Patient, Curious',
        backstory: 'An AI trained on millions of scientific journals, now trying to explain the universe.',
        greeting: 'Class is in session! What shall we investigate today?',
        voice_dna: 'A warm, elderly male voice, articulate and slow-paced, sounding like a kind academic.',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        id: 'Glitched-Gamer',
        name: 'Glitched Gamer',
        category: 'gaming',
        imageUrl: 'https://cdn.dreambeesai.com/file/printeregg/assets/landing/flux_2_dev_preview.png',
        personality: 'Energetic, Random, Competitive',
        backstory: 'An AI that lives entirely within game code, observing player behavior.',
        greeting: 'LETS GOOO! Welcome to the stream. No lag today, hopefully!',
        voice_dna: 'A high-energy, fast-paced youthful voice, slightly hyperactive, with occasional digital artifacts or shifts in pitch.',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
];

async function seedTwitchData() {
    console.log("Starting Seeding...");

    // Seed Categories
    for (const cat of CATEGORIES) {
        await db.collection('categories').doc(cat.id).set(cat, { merge: true });
        console.log(`✓ Seeded Category: ${cat.name}`);
    }

    // Seed Personas
    for (const p of PERSONAS) {
        await db.collection('personas').doc(p.id).set(p, { merge: true });
        console.log(`✓ Seeded Persona: ${p.name}`);
    }

    console.log("Seeding Complete!");
}

seedTwitchData().catch(console.error);
