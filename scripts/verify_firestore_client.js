import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root
dotenv.config({ path: join(__dirname, "..", ".env") });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

async function verify() {
    console.log("--- Project ID:", firebaseConfig.projectId, "---");
    if (!firebaseConfig.apiKey) {
        console.error("Missing API Key! Check .env file.");
        process.exit(1);
    }

    try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        console.log("Fetching models...");
        const modelsRef = collection(db, "models");
        const q = query(modelsRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);

        console.log(`Found ${querySnapshot.size} models:`);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`- ${doc.id}: ${data.name} (order: ${data.order})`);
            console.log(`  Image: ${data.image}`);
            console.log(`  IsFree: ${data.isFree}`);
        });

        if (querySnapshot.size === 0) {
            console.log("WARNING: No models found. Check if the project ID is correct and Firestore has data.");
        }

    } catch (error) {
        console.error("Error connecting to Firestore:", error);
    } finally {
        process.exit();
    }
}

verify();
