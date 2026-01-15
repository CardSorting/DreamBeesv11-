
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { VertexAI } from "@google-cloud/vertexai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// --- Configuration ---
const PROJECT_ID = "dreambees-alchemist"; // Replace with your actual Project ID if different
const LOCATION = "us-central1";
const MODEL_NAME = "gemini-2.5-flash";
const SHOWCASE_DIR = "../../public/showcase"; // Relative to this script

// Initialize Firebase Admin (Assumes ADC or configured environment)
// Note: Run with GOOGLE_APPLICATION_CREDENTIALS set if not using `firebase functions:shell` or similar context
try {
    initializeApp({
        projectId: PROJECT_ID
    });
} catch (e) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn("Warning: standard firebase initialization failed and no GOOGLE_APPLICATION_CREDENTIALS found. Ensure you are authenticated.");
    }
}

const db = getFirestore();

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const model = vertexAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
        responseMimeType: "application/json"
    }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ABS_SHOWCASE_DIR = path.resolve(__dirname, SHOWCASE_DIR);

/**
 * Analyzes an image buffer using Gemini.
 * Returns a JSON object with tags, description, style, mood, and colorPalette.
 */
const { SchemaType } = await import("@google-cloud/vertexai");

/**
 * Analyzes an image buffer using Gemini with structured output for curation.
 * Returns a typed JSON object with detailed aesthetic and content metadata.
 */
/**
 * Analyzes an image buffer using Gemini with DUAL-PURPOSE output (Discovery + ML Training).
 * Optimized for user inspiration galleries AND aesthetic dataset creation.
 */
async function analyzeImage(imageBuffer, mimeType = "image/png") {
    // 1. Define strict output schema
    const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
            // --- FRONTEND DISCOVERY ---
            searchQueries: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "3-5 natural language user search queries (e.g. 'purple hair anime girl wallpaper')."
            },
            discovery: {
                type: SchemaType.OBJECT,
                properties: {
                    vibeTags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Abstract mood/vibe tags (e.g. 'Dreamy', 'Nostalgic', 'High Energy')." },
                    suggestedCollections: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Virtual collection names (e.g. 'Sci-Fi Portraits', 'Pastel Aesthetics')." }
                }
            },
            suitability: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Best use cases: 'Mobile Wallpaper', 'Desktop Wallpaper', 'Avatar/PFP', 'Poster', 'Design Element'." },

            // --- ML / TRAINING DATA ---
            mlTraining: {
                type: SchemaType.OBJECT,
                properties: {
                    denseCaption: { type: SchemaType.STRING, description: "Highly detailed, literal description for text encoders. Mention spatial relation, lighting, textures." },
                    triggerWords: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: "Technical visual tokens for fine-tuning (e.g. 'bokeh', 'octane render', 'chiaroscuro', 'studio lighting')."
                    }
                }
            },

            // --- STANDARD METADATA ---
            description: { type: SchemaType.STRING, description: "Evocative caption describing the scene and vibe." },
            style: {
                type: SchemaType.OBJECT,
                properties: {
                    primary: { type: SchemaType.STRING, description: "Main style (e.g. Anime, Realistic, 3D)." },
                    subGenre: { type: SchemaType.STRING, description: "Specific niche (e.g. Cyberpunk, Cottagecore, Dark Fantasy)." },
                    technique: { type: SchemaType.STRING, description: "Artistic technique (e.g. Digital Painting, Vector Art, Watercolor)." }
                }
            },
            mood: { type: SchemaType.STRING, description: "Emotional atmosphere (e.g. Melancholic, Energetic, Peaceful)." },
            subject: {
                type: SchemaType.OBJECT,
                properties: {
                    category: { type: SchemaType.STRING, description: "Primary subject (Character, Landscape, Abstract)." },
                    details: { type: SchemaType.STRING, description: "Specific details (e.g. 'Fox Girl', 'Abandoned Church')." }
                }
            },
            aesthetics: {
                type: SchemaType.OBJECT,
                properties: {
                    score: { type: SchemaType.NUMBER, description: "Visual quality score 1-10 (critique lighting, composition, coherence)." },
                    quality: { type: SchemaType.STRING, description: "Tier: 'Masterpiece', 'High Quality', 'Standard'." },
                    composition: { type: SchemaType.STRING, description: "e.g. 'Rule of Thirds', 'Symmetrical', 'Dynamic Angle'." }
                }
            },
            colors: {
                type: SchemaType.OBJECT,
                properties: {
                    paletteName: { type: SchemaType.STRING, description: "Creative name for the color vibe (e.g. 'Neon Sunset', 'Pastel Dream')." },
                    dominant: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: "List of 3-5 dominant hex codes."
                    }
                }
            },
            curation: {
                type: SchemaType.OBJECT,
                properties: {
                    rating: { type: SchemaType.NUMBER, description: "1-5 stars suitability for a public showcase." },
                    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Standard filtering tags." }
                }
            }
        },
        required: ["searchQueries", "discovery", "mlTraining", "suitability", "description", "style", "mood", "subject", "aesthetics", "colors", "curation"]
    };

    // 2. Configure model with schema
    const strictModel = vertexAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });

    const prompt = `
    Analyze this image for two purposes:
    1. **Frontend Discovery**: Help users find inspiration (vibes, collections).
    2. **ML Training Data**: Generate high-quality metadata for training AI models (LoRA/Fine-tuning).
    
    Requirements:
    - **mlTraining.denseCaption**: Be extremely literal and dense. Describe every major element, lighting source, and texture.
    - **mlTraining.triggerWords**: Use "Danbooru-style" or technical art tags (e.g. "path tracing", "subsurface scattering").
    - **discovery.vibeTags**: meaningful abstract concepts.
    `;

    const request = {
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBuffer.toString("base64")
                        }
                    }
                ]
            }
        ]
    };

    try {
        const result = await strictModel.generateContent(request);
        const response = await result.response;
        const text = response.candidates[0].content.parts[0].text;

        try {
            return JSON.parse(text);
        } catch (e) {
            const cleanText = text.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanText);
        }
    } catch (error) {
        console.error("Error analyzing image:", error);
        return null;
    }
}

/**
 * Main processing function.
 */
async function processShowcase() {
    console.log(`Scanning directory: ${ABS_SHOWCASE_DIR}`);

    try {
        const dirs = await fs.readdir(ABS_SHOWCASE_DIR, { withFileTypes: true });

        for (const dir of dirs) {
            if (!dir.isDirectory()) continue;

            const categoryName = dir.name;
            const dirPath = path.join(ABS_SHOWCASE_DIR, categoryName);
            const manifestPath = path.join(dirPath, "manifest.json");

            console.log(`\nProcessing Category: ${categoryName}`);

            // Try to read manifest
            let manifest = [];
            try {
                const manifestContent = await fs.readFile(manifestPath, "utf-8");
                manifest = JSON.parse(manifestContent);
            } catch (e) {
                console.warn(`  No manifest.json found in ${categoryName}, skipping metadata lookup.`);
            }

            // Create a lookup map for manifest entries by filename (or partially match URL)
            // Manifest format example: { name: "anime_girl_001", imageUrl: "...", prompt: "..." }
            const manifestMap = new Map();
            manifest.forEach(item => {
                // Key by exact filename "anime_girl_001.png" if name implies it, or just "anime_girl_001"
                // The manifest has "name": "anime_girl_001", we will try to match loosely
                manifestMap.set(item.name, item);
            });

            const files = await fs.readdir(dirPath);

            for (const file of files) {
                if (!file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;

                const nameWithoutExt = path.parse(file).name;
                const manifestEntry = manifestMap.get(nameWithoutExt);

                // Skip if we don't have a manifest entry (optional: enforced to ensure we have valid URLs)
                if (!manifestEntry) {
                    // console.warn(`  Skipping ${file}: No matching manifest entry found.`);
                    // continue;
                    // Actually, let's process it anyway if we want strict coverage, but we need a Public URL.
                    // If no manifest, we can't easily guess the public URL unless we construct it manually.
                    // Since the user request implies existing pipeline, let's assume manifest is source of truth for URLs.
                    console.warn(`  [Warning] ${file}: No manifest entry. Using constructed local path, but checking Firestore might fail on URL.`);
                }

                const publicUrl = manifestEntry?.imageUrl || manifestEntry?.url;

                if (!publicUrl) {
                    console.warn(`  Skipping ${file}: No public URL found in manifest.`);
                    continue;
                }

                // CHECK FIRESTORE IDEMPOTENCY
                // Check if an image with this URL already exists in SHOWCASE collection
                const existingDocs = await db.collection("model_showcase_images")
                    .where("imageUrl", "==", publicUrl)
                    .limit(1)
                    .get();

                if (!existingDocs.empty) {
                    console.log(`  [Skipping] ${file} - Already exists in Showcase.`);
                    continue;
                }

                console.log(`  [Analyzing] ${file}...`);
                const startTime = Date.now();

                // Read Local File
                const buffer = await fs.readFile(path.join(dirPath, file));

                // AI Analysis
                const aiData = await analyzeImage(buffer, "image/png"); // Assuming PNG based on list_dir, logic can be smarter

                if (!aiData) {
                    console.error(`  [Failed] Could not analyze ${file}`);
                    continue;
                }

                // Prepare Firestore Document
                const docData = {
                    type: "image", // Standardize type
                    showcaseCategory: categoryName,
                    imageUrl: publicUrl,
                    thumbnailUrl: publicUrl, // Using same for now
                    prompt: manifestEntry?.prompt || "", // Original generation prompt
                    creator: manifestEntry?.creator || "System",
                    createdAt: new Date(),
                    likesCount: 0,
                    bookmarksCount: 0,

                    // AI Enriched Metadata
                    title: aiData.description.substring(0, 50) + "...", // Auto-title
                    description: aiData.description,

                    // Unified tagging strategy
                    tags: [...new Set([...(aiData.curation.tags || []), ...aiData.searchQueries, ...aiData.discovery.vibeTags, categoryName, "showcase"])],
                    searchQueries: aiData.searchQueries,

                    // Discovery Features
                    discovery: aiData.discovery,

                    // ML / Training Data
                    mlTraining: aiData.mlTraining,

                    style: aiData.style,
                    mood: aiData.mood,
                    subject: aiData.subject,
                    aesthetics: aiData.aesthetics,
                    colors: aiData.colors,
                    suitability: aiData.suitability,
                    curation: aiData.curation,

                    // Technicals
                    modelId: "gemini-2.5-flash-ml-discovery",
                    aspectRatio: "1:1" // Default, ideally parse from image
                };

                // Write to Firestore - MODEL SHOWCASE COLLECTION
                await db.collection("model_showcase_images").add(docData);
                console.log(`  [Saved] ${file} (${Date.now() - startTime}ms)`);

                // Rate Limit / Safety Pause (Gemini is fast but let's be nice to the API in a loop)
                await new Promise(r => setTimeout(r, 500));
            }
        }
    } catch (err) {
        console.error("Fatal Script Error:", err);
    }
}

processShowcase();
