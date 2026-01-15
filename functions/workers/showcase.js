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
 * Reused from script logic but adapted for worker context.
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
    // Check if an image with this Manifest ID already exists and is complete
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
        if (data.tags && data.tags.length > 0 && data.description) {
            logger.info(`[ShowcaseWorker] Skipping ${manifestId} - Already fully labeled.`);
            return;
        } else {
            logger.info(`[ShowcaseWorker] Reprocessing ${manifestId} - Incomplete metadata.`);
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

        // 2. Analyze
        const aiData = await analyzeImage(buffer, "image/png"); // Assuming PNG for now

        if (!aiData) {
            throw new Error("AI Analysis returned null.");
        }

        // 3. Prepare Data
        const docData = {
            type: "image",
            showcaseCategory: categoryName,
            manifestId: manifestId || null,
            imageUrl: imageUrl,
            thumbnailUrl: imageUrl,
            prompt: manifestEntry?.prompt || "",
            creator: manifestEntry?.creator || "System",
            createdAt: existingDocSnapshot ? existingDocSnapshot.data().createdAt : new Date(), // Keep original date if updating
            updatedAt: new Date(),
            likesCount: existingDocSnapshot ? (existingDocSnapshot.data().likesCount || 0) : 0,
            bookmarksCount: existingDocSnapshot ? (existingDocSnapshot.data().bookmarksCount || 0) : 0,

            // AI Metadata
            title: aiData.description.substring(0, 50) + "...",
            description: aiData.description,
            tags: [...new Set([...(aiData.curation.tags || []), ...aiData.searchQueries, ...aiData.discovery.vibeTags, categoryName, "showcase"])],
            searchQueries: aiData.searchQueries,
            discovery: aiData.discovery,
            mlTraining: aiData.mlTraining,
            style: aiData.style,
            mood: aiData.mood,
            subject: aiData.subject,
            aesthetics: aiData.aesthetics,
            colors: aiData.colors,
            suitability: aiData.suitability,
            curation: aiData.curation,

            modelId: "gemini-2.5-flash-ml-discovery",
            aspectRatio: "1:1"
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
