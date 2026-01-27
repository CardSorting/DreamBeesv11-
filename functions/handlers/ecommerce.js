import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "../lib/utils.js";
// [REMOVED] import { vertexFlow } from "../lib/vertexFlow.js";

const SYSTEM_INSTRUCTION = `
You are an expert e-commerce product manager and SEO specialist.
Your task is to analyze product images and extract structured data suitable for a WooCommerce CSV import.
For each image:
1. Identify the product name (creative and unique).
2. Generate a URL-friendly slug.
3. Write a compelling, SEO-friendly product description (HTML allowed) and a short excerpt.
4. Estimate a realistic regular price and sale price. Return ONLY the number (e.g., "29.99"), no currency symbols. If unsure, pick a single specific realistic value, do NOT return a range.
5. Detect colors and sizes if applicable (e.g., for shoes, clothes). If not applicable, leave empty.
6. Categorize the product and generate relevant tags.
7. Estimate physical dimensions (weight, length, width, height) if possible, or leave blank.
8. Generate a unique SKU format like 'GEN-[RANDOM]'.

Return the data strictly in the requested JSON format.
`;

const RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        post_title: { type: "STRING" },
        post_name: { type: "STRING" },
        sku: { type: "STRING" },
        regular_price: { type: "STRING" },
        sale_price: { type: "STRING" },
        weight: { type: "STRING" },
        length: { type: "STRING" },
        width: { type: "STRING" },
        height: { type: "STRING" },
        tax_product_cat: { type: "STRING" },
        tax_product_tag: { type: "STRING" },
        tax_product_brand: { type: "STRING" },
        color_options: { type: "STRING", description: "Pipe separated colors e.g. Red | Blue" },
        size_options: { type: "STRING", description: "Pipe separated sizes e.g. S | M | L" },
        description: { type: "STRING", description: "Long SEO description, HTML allowed" },
        short_description: { type: "STRING", description: "Short sales pitch" },
    },
    required: ["post_title", "post_name", "sku", "description", "short_description", "tax_product_cat"],
};

export const handleAnalyzeProductImage = async (request) => {
    const { imageBase64, mimeType } = request.data;
    const uid = request.auth?.uid;

    if (!uid) throw new HttpsError('unauthenticated', 'User must be authenticated.');
    if (!imageBase64 || !mimeType) {
        throw new HttpsError('invalid-argument', 'imageBase64 and mimeType are required.');
    }

    const COST = 0.25;

    try {
        // Deduct Zaps
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`);
            t.update(userRef, { zaps: FieldValue.increment(-COST), lastGenerationTime: FieldValue.serverTimestamp() });
        });

        const { VertexAI } = await import("@google-cloud/vertexai");
        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA
            }
        });

        logger.info(`[AutoCSV] Analyzing image for uid=${uid}`);

        let textOutput;
        try {
            // Reverted to direct call
            const result = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: "Analyze this product image and generate e-commerce data." },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: imageBase64
                                }
                            }
                        ]
                    }
                ]
            });

            const response = await result.response;
            const candidate = response.candidates?.[0];

            if (candidate?.finishReason === 'SAFETY') {
                throw new HttpsError('permission-denied', 'Blocked by Safety Filter');
            }

            textOutput = candidate?.content?.parts?.[0]?.text;

            if (!textOutput) {
                throw new HttpsError('internal', 'No data returned from Vertex AI');
            }
        } catch (aiError) {
            // Refund Zaps on AI failure
            logger.info(`[AutoCSV] Refunding Zap for uid=${uid} due to AI failure.`);
            await db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }).catch(err => logger.error("Refund failed", err));
            throw aiError;
        }

        return JSON.parse(textOutput);

    } catch (error) {
        logger.error(`[AutoCSV] Error:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', `Failed to analyze product image: ${error.message}`);
    }
};
