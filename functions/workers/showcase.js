import { db, FieldValue } from "../firebaseInit.js";
import { fetchWithRetry, logger } from "../lib/utils.js";
import { VertexAI, SchemaType } from "@google-cloud/vertexai";

// --- Configuration ---
const PROJECT_ID = "dreambees-alchemist";
const LOCATION = "us-central1";
const MODEL_NAME = "gemini-2.5-flash";

// Initialize Vertex AI (Server-side)
const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const model = vertexAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
        responseMimeType: "application/json"
    }
});

/**
 * Analyzes an image buffer using Gemini.
 * DreamBees Image Metadata v2 (Refined)
 */
async function analyzeImage(imageBuffer, mimeType = "image/png") {
    // 1. Define strict output schema V2
    const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
            // 1. Visual Composition (factual)
            composition: {
                type: SchemaType.OBJECT,
                properties: {
                    shotType: { type: SchemaType.STRING, description: "e.g. 'Close-up Portrait', 'Wide Angle'." },
                    aspectRatio: { type: SchemaType.STRING, description: "e.g. '1:1', '16:9'" },
                    view: { type: SchemaType.STRING, description: "e.g. 'eye-level', 'low-angle'" }
                }
            },

            // 2. Subject (literal)
            subject: {
                type: SchemaType.OBJECT,
                properties: {
                    category: { type: SchemaType.STRING, description: "e.g. 'Character', 'Landscape'" },
                    details: { type: SchemaType.STRING, description: "e.g. 'Anime girl with short purple hair wearing a pink visor'" }
                }
            },

            // 3. Style Lineage (classification)
            style: {
                type: SchemaType.OBJECT,
                properties: {
                    primary: { type: SchemaType.STRING, description: "Main style (e.g. Anime, Realistic)." },
                    subGenre: { type: SchemaType.STRING, description: "Specific niche (e.g. Cyberpunk, Cottagecore)." },
                    technique: { type: SchemaType.STRING, description: "Technique (e.g. Digital Painting, Vector Art)." }
                }
            },

            // 4. Atomic Tags (STRICTLY factual)
            tags: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Factual, observable tags (no vibes). e.g. 'anime', 'purple hair', 'visor'."
            },

            // 5. Color Intelligence
            colors: {
                type: SchemaType.OBJECT,
                properties: {
                    dominant: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of 5 dominant hex codes." },
                    paletteName: { type: SchemaType.STRING, description: "Creative name 'Neon Cyber-Pop'." }
                }
            },

            // 6. Vibe Layer (emotional + experiential)
            vibe: {
                type: SchemaType.OBJECT,
                properties: {
                    mood: { type: SchemaType.STRING, description: "Emotional atmosphere (e.g. Energetic)." },
                    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Vibe adjectives (e.g. 'Futuristic', 'Playful')." }
                }
            },

            // 7. Curation (Human/Brand voice)
            curation: {
                type: SchemaType.OBJECT,
                properties: {
                    rating: { type: SchemaType.NUMBER, description: "1-5 stars suitability." },
                    score: { type: SchemaType.NUMBER, description: "1-10 visual quality score." },
                    suggestedCollections: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Collection names (e.g. 'Cyberpunk Portraits')." }
                }
            },

            // 8. Discovery & SEO
            discovery: {
                type: SchemaType.OBJECT,
                properties: {
                    searchQueries: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "3-5 natural language user search queries." }
                }
            },

            // 9. ML Grounding
            mlTraining: {
                type: SchemaType.OBJECT,
                properties: {
                    denseCaption: { type: SchemaType.STRING, description: "Extremely literal descriptions for training." },
                    triggerWords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Technical visual tokens (Danbooru-style)." }
                }
            },

            // 10. Style Tokens (Internal similarity)
            styleTokens: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Internal similarity anchors (e.g. 'neon-pop', 'glossy-anime')."
            },

            // 11. Suitability
            suitability: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Usage: 'Mobile Wallpaper', 'Avatar/PFP', etc."
            }
        },
        required: ["composition", "subject", "style", "tags", "colors", "vibe", "curation", "discovery", "mlTraining", "suitability"]
    };

    // 2. Configure model with schema
    const strictModel = vertexAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema // V2 Schema
        }
    });

    const prompt = `
    Analyze this image using the "DreamBees Image Metadata V2" standard.
    
    CRITICAL DISTINCTIONS:
    1. **Atomic Tags** ('tags'): MUST be strictly factual and observable (e.g., "purple hair", "glasses"). NO vibes or abstract concepts here.
    2. **Vibe Layer** ('vibe'): Put emotional and atmospheric adjectives here (e.g., "dreamy", "energetic"). These MUST NOT mix with atomic tags.
    3. **ML Training** ('mlTraining'): 'denseCaption' should be extremely literal. 'triggerWords' should use Danbooru-style technical tags.
    
    Ensure 'styleTokens' provide unique internal anchors for similarity matching (e.g. 'neon-pop').
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
        logger.error("Error analyzing image:", error);
        return null; // Return null to indicate failure
    }
}

/**
 * Cloud Task Worker for Showcase Processing
 */
export const processShowcaseTask = async (req) => {
    // req.data depends on how we enqueue. Assuming structure:
    // { imageUrl, manifestId, categoryName, manifestEntry, ... }
    const { imageUrl, manifestId, categoryName, manifestEntry } = req.data;

    if (!imageUrl || !categoryName) {
        logger.warn("[ShowcaseWorker] Missing imageUrl or categoryName", req.data);
        return;
    }

    logger.info(`[ShowcaseWorker] Processing: ${manifestId} (${imageUrl})`);

    // --- IDEMPOTENCY CHECK (Redundant but safe) ---
    // Check if an image with this Manifest ID already exists and has the V2 schema check (e.g. check for 'vibe' field)
    let existingDocSnapshot = null;

    if (manifestId) {
        const idQuery = await db.collection("model_showcase_images")
            .where("manifestId", "==", manifestId)
            .limit(1)
            .get();
        if (!idQuery.empty) existingDocSnapshot = idQuery.docs[0];
    } else {
        // Fallback checks
        const urlQuery = await db.collection("model_showcase_images")
            .where("imageUrl", "==", imageUrl)
            .limit(1)
            .get();
        if (!urlQuery.empty) existingDocSnapshot = urlQuery.docs[0];
    }

    if (existingDocSnapshot) {
        const data = existingDocSnapshot.data();
        // Check for V2 specific field 'vibe' to know if it's already updated
        if (data.vibe && data.tags && data.tags.length > 0) {
            logger.info(`[ShowcaseWorker] Skipping ${manifestId} - Already fully labeled (V2).`);
            return;
        } else {
            logger.info(`[ShowcaseWorker] Reprocessing ${manifestId} - Updating to V2 Metadata.`);
        }
    }

    // --- EXECUTION ---
    const startTime = Date.now();

    try {
        // 1. Fetch Image
        const response = await fetchWithRetry(imageUrl, {
            timeout: 30000,
            retries: 3
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Analyze with automatic retry for 429 warnings
        let aiData = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                aiData = await analyzeImage(buffer, "image/png");
                if (aiData) break;
            } catch (err) {
                // Check for quota/rate limit error strings
                if (err.message.includes("429") || err.message.includes("Resource exhausted") || err.message.includes("503")) {
                    attempts++;
                    if (attempts >= maxAttempts) throw err;

                    const waitTime = 2000 * Math.pow(2, attempts); // 4s, 8s...
                    logger.warn(`[ShowcaseWorker] Hit rate limit (429). Retrying in ${waitTime / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    throw err;
                }
            }
        }

        if (!aiData) {
            throw new Error("AI Analysis returned null.");
        }

        // 3. Prepare Data (Flattening somewhat for Firestore querying, or keeping structure?)
        // User requested robust provenance, so we keep the structure but ensure top-level queryables exist if needed.
        // For now, we will save the structure AS IS for the new fields, but also populate top-level Search fields if needed.

        // Ensure curation.showcaseCategory is set
        if (aiData.curation) {
            aiData.curation.showcaseCategory = categoryName;
        }

        const docData = {
            // Core Identity
            type: "image",
            manifestId: manifestId || null,
            imageUrl: imageUrl,
            thumbnailUrl: imageUrl,
            creator: manifestEntry?.creator || "Gemini 3 Pro",
            prompt: manifestEntry?.prompt || "",
            modelId: "gemini-2.5-flash-ml-discovery",
            // modelName: "Ani Detox", // Could infer from categoryName if needed, or leave out

            // Timestamps
            createdAt: existingDocSnapshot ? existingDocSnapshot.data().createdAt : new Date(),
            updatedAt: new Date(),

            // Counters
            likesCount: existingDocSnapshot ? (existingDocSnapshot.data().likesCount || 0) : 0,
            bookmarksCount: existingDocSnapshot ? (existingDocSnapshot.data().bookmarksCount || 0) : 0,

            // V2 Metadata Structure
            composition: aiData.composition,
            subject: aiData.subject,
            style: aiData.style,

            // Tags (Atomic)
            tags: aiData.tags || [], // Ensure array

            // Color Intelligence
            colors: aiData.colors,

            // Vibe Layer
            vibe: aiData.vibe,

            // Curation
            curation: aiData.curation,

            // Discovery & SEO
            discovery: aiData.discovery,

            // ML Grounding
            mlTraining: aiData.mlTraining,

            // Optional Style Tokens
            styleTokens: aiData.styleTokens || [],

            // Suitability
            suitability: aiData.suitability,

            // Legacy / Top-level fallback (optional, for existing UI compatibility if needed)
            title: aiData.subject.details.substring(0, 50) + "...",
            description: aiData.mlTraining.denseCaption || aiData.subject.details, // Use dense caption as description? Or subject details? User said "subject.details" is literal.
            // Note: User provided example showing `description` wasn't in the root, but `prompt` was.
            // Existing frontend might use `description`. Let's map `subject.details` to `description` for backward compat if needed.
        };

        // 4. Save
        if (existingDocSnapshot) {
            await existingDocSnapshot.ref.update(docData);
            logger.info(`[ShowcaseWorker] Updated ${manifestId} (${Date.now() - startTime}ms)`);
        } else {
            await db.collection("model_showcase_images").add(docData);
            logger.info(`[ShowcaseWorker] Created ${manifestId} (${Date.now() - startTime}ms)`);
        }

    } catch (error) {
        logger.error(`[ShowcaseWorker] Failed to process ${manifestId}:`, error);
        throw error; // Rethrow to trigger Cloud Task retry if configured
    }
};
