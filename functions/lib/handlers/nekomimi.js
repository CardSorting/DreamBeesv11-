import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "../firebaseInit.js";
import { handleError, logger, getS3Client } from "../lib/utils.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
/**
 * Handle Nekomimi Transform Request
 * Ported from frontend nekomimiService to backend Vertex AI
 */
export const handleNekomimiTransform = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }
    const { imageBase64, mimeType, prompt } = request.data;
    if (!imageBase64 || !prompt) {
        throw new HttpsError('invalid-argument', "Image and prompt are required");
    }
    try {
        // 1. Initialize Vertex AI
        const { VertexAI } = await import("@google-cloud/vertexai");
        const vertexAI = new VertexAI({
            project: process.env.GCLOUD_PROJECT || 'dreambees-alchemist',
            location: 'us-central1'
        });
        const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
        // 2. Execute Vertex AI call
        logger.info(`[Nekomimi] Executing Vertex AI call for user ${uid}...`);
        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType: mimeType || 'image/png',
                                data: imageBase64
                            }
                        },
                        { text: prompt }
                    ]
                }
            ]
        });
        const response = await result.response;
        const candidate = response.candidates?.[0];
        if (!candidate) {
            throw new Error("Vertex AI returned no candidates. The request might have been blocked or failed.");
        }
        if (candidate?.finishReason === 'SAFETY') {
            throw new Error("Blocked by Safety Filter");
        }
        // Robust parsing of parts
        const parts = candidate?.content?.parts || [];
        const imagePart = parts.find(p => p.inlineData);
        const generatedImageBase64 = imagePart?.inlineData?.data;
        const textOutput = parts.find(p => p.text)?.text || "";
        if (!generatedImageBase64) {
            logger.error("[Nekomimi] No image data in response parts", null, { partsCount: parts.length, hasText: !!textOutput });
            throw new Error("No image data returned from Vertex AI");
        }
        // 3. Process Output (Base64 -> Sharp -> B2 Upload)
        const { default: sharp } = await import("sharp");
        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
        const sharpImg = sharp(imageBuffer);
        // Optimizations
        const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
        const thumbBuffer = await sharpImg
            .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
        const lqipBuffer = await sharpImg
            .resize(20, 20, { fit: 'inside' })
            .webp({ quality: 20 })
            .toBuffer();
        const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;
        // Upload to B2
        const baseFolder = `generated/${uid}/nekomimi_${Date.now()}`;
        const originalFilename = `${baseFolder}.webp`;
        const thumbFilename = `${baseFolder}_thumb.webp`;
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = await getS3Client();
        await Promise.all([
            s3.send(new PutObjectCommand({
                Bucket: B2_BUCKET,
                Key: originalFilename,
                Body: webpBuffer,
                ContentType: "image/webp"
            })),
            s3.send(new PutObjectCommand({
                Bucket: B2_BUCKET,
                Key: thumbFilename,
                Body: thumbBuffer,
                ContentType: "image/webp"
            }))
        ]);
        const finalImageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
        const finalThumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;
        // 4. Persistence to Firestore
        const imageRef = await db.collection("images").add({
            userId: uid,
            prompt: prompt,
            imageUrl: finalImageUrl,
            thumbnailUrl: finalThumbnailUrl,
            lqip,
            isPublic: true,
            createdAt: FieldValue.serverTimestamp(),
            type: 'nekomimi_magic',
            metadata: {
                textOutput // Store the raw text output too
            }
        });
        return {
            imageUrl: finalImageUrl,
            thumbnailUrl: finalThumbnailUrl,
            lqip,
            imageId: imageRef.id,
            textOutput,
            mimeType: 'image/webp'
        };
    }
    catch (error) {
        logger.error("[Nekomimi] backend error:", error);
        throw handleError(error, { uid });
    }
};
//# sourceMappingURL=nekomimi.js.map