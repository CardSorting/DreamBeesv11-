import { db } from "../firebaseInit.js";
import { fetchWithRetry, logger } from "../lib/utils.js";
import { VertexAI, SchemaType } from "@google-cloud/vertexai";
// --- Configuration ---
const PROJECT_ID = "dreambees-alchemist";
const LOCATION = "us-central1";
const MODEL_NAME = "gemini-2.5-flash";
// Initialize Vertex AI (Server-side)
const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
/**
 * Analyzes an image buffer using Gemini.
 * DreamBees Image Metadata v2 (Refined)
 */
async function analyzeImage(imageBuffer, mimeType = "image/png") {
    const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
            composition: {
                type: SchemaType.OBJECT,
                properties: {
                    shotType: { type: SchemaType.STRING, description: "e.g. 'Close-up Portrait', 'Wide Angle'." },
                    aspectRatio: { type: SchemaType.STRING, description: "e.g. '1:1', '16:9'" },
                    view: { type: SchemaType.STRING, description: "e.g. 'eye-level', 'low-angle'" }
                }
            },
            subject: {
                type: SchemaType.OBJECT,
                properties: {
                    category: { type: SchemaType.STRING, description: "e.g. 'Character', 'Landscape'" },
                    gender: { type: SchemaType.STRING, description: "e.g. 'male', 'female', 'other' (if applicable)" },
                    details: { type: SchemaType.STRING, description: "e.g. 'Anime girl with short purple hair wearing a pink visor'" }
                }
            },
            style: {
                type: SchemaType.OBJECT,
                properties: {
                    primary: { type: SchemaType.STRING, description: "Main style (e.g. Anime, Realistic)." },
                    subGenre: { type: SchemaType.STRING, description: "Specific niche (e.g. Cyberpunk, Cottagecore)." },
                    technique: { type: SchemaType.STRING, description: "Technique (e.g. Digital Painting, Vector Art)." }
                }
            },
            tags: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Factual, observable tags (no vibes). e.g. 'anime', 'purple hair', 'visor'."
            },
            colors: {
                type: SchemaType.OBJECT,
                properties: {
                    dominant: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of 5 dominant hex codes." },
                    paletteName: { type: SchemaType.STRING, description: "Creative name 'Neon Cyber-Pop'." }
                }
            },
            vibe: {
                type: SchemaType.OBJECT,
                properties: {
                    mood: { type: SchemaType.STRING, description: "Emotional atmosphere (e.g. Energetic)." },
                    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Vibe adjectives (e.g. 'Futuristic', 'Playful')." }
                }
            },
            curation: {
                type: SchemaType.OBJECT,
                properties: {
                    rating: { type: SchemaType.NUMBER, description: "1-5 stars suitability." },
                    score: { type: SchemaType.NUMBER, description: "1-10 visual quality score." },
                    suggestedCollections: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Collection names (e.g. 'Cyberpunk Portraits')." }
                }
            },
            discovery: {
                type: SchemaType.OBJECT,
                properties: {
                    searchQueries: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "3-5 natural language user search queries." }
                }
            },
            mlTraining: {
                type: SchemaType.OBJECT,
                properties: {
                    denseCaption: { type: SchemaType.STRING, description: "Extremely literal descriptions for training." },
                    triggerWords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Technical visual tokens (Danbooru-style)." }
                }
            },
            styleTokens: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Internal similarity anchors (e.g. 'neon-pop', 'glossy-anime')."
            },
            suitability: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Usage: 'Mobile Wallpaper', 'Avatar/PFP', etc."
            }
        },
        required: ["composition", "subject", "style", "tags", "colors", "vibe", "curation", "discovery", "mlTraining", "suitability"]
    };
    const strictModel = vertexAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });
    const prompt = `
    Analyze this image using the "DreamBees Image Metadata V2" standard.
    
    Ensure 'styleTokens' provide unique internal anchors for similarity matching.
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
        const response = result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        return JSON.parse(text);
    }
    catch (error) {
        logger.error("Error analyzing image:", error);
        return null;
    }
}
/**
 * Cloud Task Worker for Showcase Processing
 */
export const processShowcaseTask = async (req) => {
    const { imageUrl, manifestId, categoryName, manifestEntry } = req.data;
    if (!imageUrl || !categoryName) {
        logger.warn("[ShowcaseWorker] Missing imageUrl or categoryName", req.data);
        return;
    }
    logger.info(`[ShowcaseWorker] Processing: ${manifestId} (${imageUrl})`);
    let existingDocSnapshot = null;
    if (manifestId) {
        const idQuery = await db.collection("model_showcase_images")
            .where("manifestId", "==", manifestId)
            .get();
        if (!idQuery.empty) {
            const match = idQuery.docs.find(d => d.data().showcaseCategory === categoryName);
            if (match) {
                existingDocSnapshot = match;
            }
        }
    }
    else {
        const urlQuery = await db.collection("model_showcase_images")
            .where("imageUrl", "==", imageUrl)
            .limit(1)
            .get();
        if (!urlQuery.empty) {
            existingDocSnapshot = urlQuery.docs[0];
        }
    }
    if (existingDocSnapshot) {
        const data = existingDocSnapshot.data();
        if (data.vibe && data.tags && data.tags.length > 0 && data.subject && data.subject.gender) {
            logger.info(`[ShowcaseWorker] Skipping ${manifestId} - Already fully labeled (V2).`);
            return;
        }
    }
    const startTime = Date.now();
    try {
        const response = await fetchWithRetry(imageUrl, { timeout: 30000, retries: 3 });
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const aiData = await analyzeImage(buffer, "image/png");
        if (!aiData) {
            throw new Error("AI Analysis returned null.");
        }
        if (aiData.curation) {
            aiData.curation.showcaseCategory = categoryName;
        }
        const docData = {
            type: "image",
            manifestId: manifestId || null,
            imageUrl: imageUrl,
            thumbnailUrl: imageUrl,
            creator: manifestEntry?.creator || "Gemini 2.5 Flash",
            prompt: manifestEntry?.prompt || "",
            modelId: "gemini-2.5-flash-ml-discovery",
            createdAt: existingDocSnapshot ? existingDocSnapshot.data().createdAt : new Date(),
            updatedAt: new Date(),
            likesCount: existingDocSnapshot ? (existingDocSnapshot.data().likesCount || 0) : 0,
            bookmarksCount: existingDocSnapshot ? (existingDocSnapshot.data().bookmarksCount || 0) : 0,
            composition: aiData.composition,
            subject: aiData.subject,
            style: aiData.style,
            tags: aiData.tags || [],
            colors: aiData.colors,
            vibe: aiData.vibe,
            curation: aiData.curation,
            discovery: aiData.discovery,
            mlTraining: aiData.mlTraining,
            styleTokens: aiData.styleTokens || [],
            suitability: aiData.suitability,
            title: aiData.subject.details.substring(0, 50) + "...",
            description: aiData.mlTraining.denseCaption || aiData.subject.details,
        };
        if (existingDocSnapshot) {
            await existingDocSnapshot.ref.update(docData);
            logger.info(`[ShowcaseWorker] Updated ${manifestId} (${Date.now() - startTime}ms)`);
        }
        else {
            await db.collection("model_showcase_images").add(docData);
            logger.info(`[ShowcaseWorker] Created ${manifestId} (${Date.now() - startTime}ms)`);
        }
    }
    catch (error) {
        logger.error(`[ShowcaseWorker] Failed to process ${manifestId}:`, error);
        throw error;
    }
};
//# sourceMappingURL=showcase.js.map