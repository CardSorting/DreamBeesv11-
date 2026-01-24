import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "../firebaseInit.js";
import { handleError, logger, retryOperation, getS3Client } from "../lib/utils.js";
import { vertexFlow } from "../lib/vertexFlow.js";
import { VertexAI } from "@google-cloud/vertexai";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

/**
 * Generates a list of 30 distinct coloring book page concepts based on a theme.
 */
export const handleCreateBookConcepts = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { theme, style } = request.data;
    if (!theme || !style) throw new HttpsError('invalid-argument', "Theme and Style are required.");

    // Cost: 1 Zap for the brainstorming session? Let's say 0.5 for text.
    const COST = 0.5;

    try {
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`);
            t.update(userRef, { zaps: FieldValue.increment(-COST) });
        });

        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are a professional children's book illustrator.
            Generate a list of exactly 30 distinct, creative, and sequential coloring book page descriptions based on the theme: "${theme}".
            The art style is: "${style}".
            
            Requirements:
            - Each description must be a visual prompt suitable for generating an image.
            - Vary the subjects (close-ups, wide shots, characters, objects).
            - Maintain a cohesive narrative or thematic flow across the 30 pages.
            - Keep descriptions concise (10-20 words).
            - Do NOT include page numbers in the strings themselves.
            - Return ONLY a valid JSON object with a "pages" property containing the array of strings.
        `;

        const result = await vertexFlow.execute('COLORCRAFT_CONCEPTS', async () => {
            return await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }, vertexFlow.constructor.PRIORITY.NORMAL);

        const responseText = (await result.response).candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error("No text returned from AI");

        logger.info(`[ColorCraft] Concepts generated for ${uid}`, { theme });

        const parsed = JSON.parse(responseText);
        if (!parsed.pages || !Array.isArray(parsed.pages)) throw new Error("Invalid JSON structure");

        return { pages: parsed.pages.slice(0, 30) };

    } catch (error) {
        // Refund
        if (error.code !== 'resource-exhausted') {
            await retryOperation(() => db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }), { context: 'Refund ColorCraft Concepts' })
                .catch(e => logger.error("Refund failed", e, { uid }));
        }
        throw handleError(error, { uid });
    }
};

/**
 * Generates a single coloring page image.
 */
export const handleCreateColoringPage = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt, style } = request.data;
    if (!prompt) throw new HttpsError('invalid-argument', "Prompt is required.");

    // Cost: 1 Zap per image
    const COST = 1;

    try {
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`);
            t.update(userRef, { zaps: FieldValue.increment(-COST) });
        });

        // Construct Prompts (Adapted from original service)
        const basePrompt = `
            Create a black and white coloring book page image.
            Subject: ${prompt}.
            Style: ${style}.
            
            Strict Guidelines:
            - OUTPUT AN IMAGE, NOT TEXT.
            - Pure black lines on white background.
            - No colors, no shading, no grayscale.
            - High contrast line art.
            - Center the subject.
            - White background is mandatory.
        `;

        let styleNuance = "";
        switch (style) {
            case 'Simple': styleNuance = "Bold, thick outlines. Simple geometry. Minimal detail. Cute. Easy to color."; break;
            case 'Detailed': styleNuance = "Fine, intricate lines. High detail. Realistic textures. Complex."; break;
            case 'Mandala': styleNuance = "Symmetrical, geometric patterns. Mandala style. Meditative."; break;
            case 'Anime': styleNuance = "Anime manga style line art. Clean ink. Expressive."; break;
            default: styleNuance = "Clean line art.";
        }

        const finalPrompt = `${basePrompt} ${styleNuance}`;

        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        // Use gemini-2.5-flash-image for speed and cost effectiveness like in the original app
        // Or could use imagen-3 if higher quality is needed, but adherence to original is key.
        const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

        const result = await vertexFlow.execute('COLORCRAFT_IMAGE', async () => {
            return await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
                // Valid config for image generation
                generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 0.4
                }
                // note: aspectRatio is not directly supported in generateContent for Gemini 2.5 Flash Image via Vertex Node SDK in the same way as AI Studio
                // usually it respects the prompt "Aspect Ratio 3:4" or similar if the model supports it.
                // However, Gemini 2.5 Flash might natively output square. 
                // Let's add aspect ratio to prompt to be safe.
            });
        }, vertexFlow.constructor.PRIORITY.NORMAL);

        const response = (await result.response).candidates?.[0];
        if (response?.finishReason === 'SAFETY') throw new HttpsError('failed-precondition', "Blocked by safety filter.");

        // Gemini 2.5 Flash Image returns inline data
        const generatedImageBase64 = response?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!generatedImageBase64) throw new Error("No image data returned from AI");

        // --- Post Processing & Storage (Match MeowAcc Pattern) ---
        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
        const sharpImg = sharp(imageBuffer);

        const [webpBuffer, thumbBuffer] = await Promise.all([
            sharpImg.webp({ quality: 90 }).toBuffer(),
            sharpImg.resize(512, 512, { fit: 'inside' }).webp({ quality: 80 }).toBuffer()
        ]);

        const timestamp = Date.now();
        const baseFolder = `generated/${uid}/colorcraft_${timestamp}`;
        const originalFilename = `${baseFolder}.webp`;
        const thumbFilename = `${baseFolder}_thumb.webp`;

        const s3 = await getS3Client();
        await Promise.all([
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalFilename, Body: webpBuffer, ContentType: "image/webp" })),
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbFilename, Body: thumbBuffer, ContentType: "image/webp" }))
        ]);

        const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
        const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

        // Save to DB
        await db.collection("images").add({
            userId: uid,
            prompt: `[COLORCRAFT] ${prompt}`,
            modelId: 'colorcraft',
            imageUrl,
            thumbnailUrl,
            createdAt: FieldValue.serverTimestamp(),
            type: 'colorcraft',
            style: style
        });

        // Return exact format frontend expects (plus URL for persistence)
        return {
            imageUrl,
            thumbnailUrl,
            // If the frontend needs base64 for immediate display we can send it, 
            // but URL is better. For now sending URL.
        };

    } catch (error) {
        if (error.code !== 'resource-exhausted') {
            await retryOperation(() => db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }), { context: 'Refund ColorCraft Image' })
                .catch(e => logger.error("Refund failed", e, { uid }));
        }
        throw handleError(error, { uid });
    }
};
