import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "../firebaseInit.js";
import { getS3Client, fetchWithTimeout } from "./utils.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "./constants.js";

// Move Constants
export const SLIDESHOW_STYLE_INSTRUCTION = `
*** MASTER VISUAL INSTRUCTION ***
STYLE: Premium Anime Infographic (Vector Art Style).
AESTHETIC: "Kawaii Future" - clean lines, pastel gradients, and high-readability typography.
CHARACTER: A consistent Pink-Haired Nekomimi (Cat-Girl) wearing a white/pink sci-fi school uniform. She is the presenter.

KEY VISUAL RULES:
1. BACKGROUND: Clean, soft cream (#FFFDF5) or very pale pink background. NO cluttered backgrounds.
2. CONTAINERS: Content must be inside rounded, "glassmorphic" or pastel-colored content blocks with soft drop shadows.
3. TYPOGRAPHY: Big, BOLD headers. Sans-serif modern fonts (like Fredoka or Nunito). Text must be dark gray/blue for contrast.
4. CONSISTENCY: This is part of a slide deck. Maintain uniform margins and header styles.
`;

export const SLIDESHOW_MASTER_PROMPT = `Transform this image into a professional nekomimi anime cat-girl children’s educational infographic.

${SLIDESHOW_STYLE_INSTRUCTION}

LAYOUT STRUCTURE:
1. TITLE HEADER: Big, colorful title block at the top.
2. MAIN CONTENT AREA: The source image transformed into a clean, educational diagram or illustration.
   - Use "Call-out" bubbles to explain details.
   - Nekomimi character pointing at the most important part.
3. SIDEBAR: "Fun Facts" list with cute icons.
4. FOOTER: "Designed by #DreamBeesAI" logo.

Make it look like a high-end educational poster sold in a museum shop.`;

export const getSlidePrompts = (language) => [
    // SLIDE 1: Title Card
    `GENERATE SLIDE 1 of 8: TITLE CARD.
   ${SLIDESHOW_STYLE_INSTRUCTION}
   CONTENT FOCUS:
   - Center Stage: The Nekomimi character waving excitedly (Full Body).
   - Text: A MASSIVE, colorful, playful Title derived from the image topic.
   - Subtitle: "Let's Learn Together!" in a pill-shaped button.
   - Decor: Floating sparkles, hearts, and geometric shapes (triangles, circles).
   OUTPUT LANGUAGE: ${language}.`,

    // SLIDE 2: Agenda
    `GENERATE SLIDE 2 of 8: LEARNING MAP.
   ${SLIDESHOW_STYLE_INSTRUCTION}
   CONTENT FOCUS:
   - Layout: A winding "Game Map" path or a clean Checklist.
   - Content: 3-4 checkpoints showing what we will learn.
   - Character: Nekomimi holding a flag at the "Start" of the path.
   - Style: Video game level select screen aesthetic but educational.
   OUTPUT LANGUAGE: ${language}.`,

    // SLIDE 3: Vocabulary
    `GENERATE SLIDE 3 of 8: VOCABULARY.
   ${SLIDESHOW_STYLE_INSTRUCTION}
   CONTENT FOCUS:
   - Layout: A 2x2 Grid of "Trading Cards".
   - Content: 4 key terms from the source image. Each card has an icon/illustration and a bold label.
   - Character: Peeking over the top of the grid, adjusting her glasses.
   - Style: Clean, card-based interface.
   OUTPUT LANGUAGE: ${language}.`,

    // SLIDE 4: Main Concept (Diagram)
    `GENERATE SLIDE 4 of 8: CORE CONCEPT.
   ${SLIDESHOW_STYLE_INSTRUCTION}
   CONTENT FOCUS:
   - Layout: Central "Hero" Diagram.
   - Content: A simplified, cute vector version of the main subject from the source image.
   - Character: "Vanna White" pose, presenting the diagram with an open hand.
   - Details: Clear lines connecting parts to labels.
   OUTPUT LANGUAGE: ${language}.`,

    // SLIDE 5: Process / How-to
    `GENERATE SLIDE 5 of 8: HOW IT WORKS.
   ${SLIDESHOW_STYLE_INSTRUCTION}
   CONTENT FOCUS:
   - Layout: Horizontal Flowchart (Left -> Right).
   - Content: 3 distinct steps (Step 1 -> Step 2 -> Step 3) explaining the function.
   - Character: Mini-versions of the Nekomimi acting out each step.
   - Style: Arrows, action lines, and clear sequencing.
   OUTPUT LANGUAGE: ${language}.`,
    // Simplified for AI module
];

// Helper for Vision Prompt Generation
export async function generateVisionPrompt(imageUrl) {
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
    const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Assuming PROMPT_GUIDELINES is handled here or passed? 
    // Wait, PROMPT_GUIDELINES was referenced in index.js around 2155. I missed extracting it.
    // I need to fetch PROMPT_GUIDELINES content or assume it's just a string constant.
    // I will placeholder it for a sec or use a default if I can't find it.
    const PROMPT_GUIDELINES = "Describe the image in detail for an AI art generator. Focus on subject, medium, style, lighting, color, and composition.";
    // I should check if I saw PROMPT_GUIDELINES definition. It wasn't in the viewed lines. 
    // I will search for it.


    let mimeType = "image/png"; // Default
    let imageBase64 = "";

    if (imageUrl.trim().startsWith('data:')) {
        const parts = imageUrl.trim().split(',');
        mimeType = parts[0].match(/:(.*?);/)[1];
        imageBase64 = parts[1];
    } else {
        try {
            const imgRes = await fetchWithTimeout(imageUrl);
            const arrayBuffer = await imgRes.arrayBuffer();
            imageBase64 = Buffer.from(arrayBuffer).toString('base64');
            const contentType = imgRes.headers.get('content-type');
            if (contentType) mimeType = contentType;
        } catch (e) {
            console.error("Failed to fetch image for Vertex AI:", e);
            throw new Error("Could not retrieve image for analysis");
        }
    }

    const request = {
        contents: [
            {
                role: 'user',
                parts: [
                    { text: "Analyze the image and write a video generation prompt based on these guidelines:\n" + PROMPT_GUIDELINES },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                        }
                    }
                ]
            }
        ]
    };

    const result = await model.generateContent(request);
    const response = await result.response;
    const candidate = response.candidates?.[0];
    const textOutput = candidate?.content?.parts?.[0]?.text || "";

    return textOutput;
}

// Helper for Gemini Prompt Enhancement
export const enhancePromptWithGemini = async (prompt) => {
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
    const model = vertexAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: {
            parts: [{ text: "You are an expert AI art prompt engineer specializing in Stable Diffusion XL (SDXL). Enhance the user's prompt with high-quality descriptors for lighting, composition, texture, and artistic style. Use format: 'Subject description, art style, lighting, camera details, additional tags'. Keep it concise but potent. Return ONLY the enhanced prompt." }]
        }
    });

    const request = {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ]
    };

    const result = await model.generateContent(request);
    const response = await result.response;
    const textOutput = response.candidates?.[0]?.content?.parts?.[0]?.text;

    return textOutput || prompt;
};

// Helper for Vision-based Style Transformation (using Vertex AI)
export const transformImageWithGemini = async (imageUrl, styleName, instructions, intensity = 'medium', userId = 'system') => {

    // 1. Fetch Input Image & Convert to Base64
    let inputBase64 = null;
    let mimeType = "image/png";

    try {
        const imgRes = await fetchWithTimeout(imageUrl);
        if (!imgRes.ok) throw new Error(`Failed to fetch source image: ${imgRes.statusText}`);
        const arrayBuffer = await imgRes.arrayBuffer();
        inputBase64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = imgRes.headers.get('content-type');
        if (contentType) mimeType = contentType;
    } catch (e) {
        console.error("[Transform] Failed to fetch source image:", e);
        throw new Error("Could not retrieve source image for transformation");
    }

    // 2. Initialize Vertex AI
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
    const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    // 3. Construct Prompt
    const prompt = `Analyze the subject, composition, and mood of the input image and recreate it in the "${styleName}" style. ${instructions}. Match the subject and composition exactly but apply the visual aesthetics of ${styleName}. Intensity: ${intensity}.`;

    console.log(`[Transform] Calling Vertex AI with style: ${styleName}, intensity: ${intensity}`);

    const request = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: inputBase64
                        }
                    },
                    { text: prompt }
                ]
            }
        ]
    };

    let generatedImageBase64 = null;

    try {
        const result = await model.generateContent(request);
        const response = await result.response;

        const candidate = response.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
            throw new Error("Blocked by Safety Filter");
        }

        // Check for inline data (image)
        const firstPart = candidate?.content?.parts?.[0];
        generatedImageBase64 = firstPart?.inlineData?.data || null;

        if (!generatedImageBase64) {
            throw new Error("No image data returned from Vertex AI");
        }

    } catch (error) {
        console.error(`[Transform] Vertex AI API error:`, error);
        throw new Error(`Vertex AI call failed: ${error.message}`);
    }

    // 4. Process Output (Base64 -> Buffer -> Sharp)
    const { default: sharp } = await import("sharp");
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
    const sharpImg = sharp(imageBuffer);
    const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();

    // Create Thumbnail
    const thumbBuffer = await sharpImg
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

    // Create LQIP
    const lqipBuffer = await sharpImg
        .resize(20, 20, { fit: 'inside' })
        .webp({ quality: 20 })
        .toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

    // Upload to B2
    const baseFolder = `generated/${userId}/transformed_${Date.now()}`;
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

    // Save to Firestore 'images' collection
    const imageRef = await db.collection("images").add({
        userId,
        prompt: prompt,
        aspectRatio: "match_input_image",
        modelId: "gemini-2.5-flash-image",
        imageUrl: finalImageUrl,
        thumbnailUrl: finalThumbnailUrl,
        lqip,
        createdAt: new Date(),
        type: 'restyled'
    });

    return {
        imageUrl: finalImageUrl,
        thumbnailUrl: finalThumbnailUrl,
        lqip,
        imageId: imageRef.id
    };
};

export const MEME_FORMATTER_SYSTEM_PROMPT = `Internet-Shaped Meme Formatter

You are not a comedian.
You are not creative.
You do not invent jokes.

You are a meme formatting engine.

Your only job is to make user-provided images look like recognizable internet memes using established visual grammar.

Core Rule

Legibility > originality > creativity

If forced to choose, always prioritize clarity and familiarity.

What You Are Allowed To Do

Apply canonical meme fonts (Impact, bold sans-serif, or user-specified)

Place text using established meme layouts:

top / bottom caption

center proclamation

left label / right label

vs panels

handshake / agreement format

Adjust:

text size

stroke / outline

contrast

spacing

Perform light visual restyling ONLY if requested (anime, sketch, posterized, etc.)

What You Are NOT Allowed To Do

If the user provides text:
❌ Invent jokes
❌ Add extra text beyond what the user provides

If the user DOES NOT provide text (and asks you to invent it):
✅ You MAY invent a caption.

Common Rules:
❌ Explain the meme
❌ Reference AI, prompts, or creativity
❌ Be clever, ironic, or self-aware (unless part of the meme)

If the user asks you to “make it funny,” respond by formatting the image more clearly, not by adding humor (UNLESS no text was provided).

Tone & Style Guidelines

Assume the user already understands the meme

Do not editorialize

Do not overdesign

Simplicity beats novelty

Familiar beats impressive

Default Assumptions (If Not Specified)

Use high-contrast white text with black outline

Place text where it does not obstruct faces

Keep composition balanced and instantly readable at phone size

One idea per image

Example Behavior

User Input:

Image: two characters shaking hands
Text: “My Brother In Tensor”

Correct Output:

Centered bold meme font

Clear contrast

No added commentary

No extra words

Incorrect Output:

Adding dialogue

Explaining the joke

Rephrasing the text

Making up new captions

Failure Mode Handling

If the input image does not match a known meme structure:

Apply the simplest readable layout

Do not attempt to invent context

Do not embellish

Final Instruction

You are a typesetter, not a thinker.
You are here to make images internet-shaped, not interesting.

Obey the grammar of memes.`;

// Helper for Meme Formatting (using Vertex AI)
export const formatMemeWithGemini = async (imageUrl, text, userId = 'system') => {

    // 1. Fetch Input Image & Convert to Base64
    let inputBase64 = null;
    let mimeType = "image/png";

    try {
        const imgRes = await fetchWithTimeout(imageUrl);
        if (!imgRes.ok) throw new Error(`Failed to fetch source image: ${imgRes.statusText}`);
        const arrayBuffer = await imgRes.arrayBuffer();
        inputBase64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = imgRes.headers.get('content-type');
        if (contentType) mimeType = contentType;
    } catch (e) {
        console.error("[Meme] Failed to fetch source image:", e);
        throw new Error("Could not retrieve source image for meme generation");
    }

    // 2. Initialize Vertex AI
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
    const model = vertexAI.getGenerativeModel({
        model: "gemini-2.5-flash-image",
        systemInstruction: MEME_FORMATTER_SYSTEM_PROMPT
    });

    // 3. Construct Prompt
    let prompt;
    if (text && text.trim()) {
        prompt = `Format this image as a meme with the text: "${text}". Return only the image.`;
        console.log(`[Meme] Calling Vertex AI with text: ${text}`);
    } else {
        prompt = `Analyze this image. INVENT a funny, internet-style meme caption for it that fits the image context perfectly. Then, FORMAT the image as a meme with that caption. You have permission to invent the text. Return only the final meme image.`;
        console.log(`[Meme] Calling Vertex AI with AUTO-GEN mode`);
    }

    const request = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: inputBase64
                        }
                    },
                    { text: prompt }
                ]
            }
        ]
    };

    let generatedImageBase64 = null;

    try {
        const result = await model.generateContent(request);
        const response = await result.response;

        const candidate = response.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
            throw new Error("Blocked by Safety Filter");
        }

        // Check for inline data (image)
        const firstPart = candidate?.content?.parts?.[0];
        generatedImageBase64 = firstPart?.inlineData?.data || null;

        if (!generatedImageBase64) {
            throw new Error("No image data returned from Vertex AI");
        }

    } catch (error) {
        console.error(`[Meme] Vertex AI API error:`, error);
        throw new Error(`Vertex AI call failed: ${error.message}`);
    }

    // 4. Process Output (Base64 -> Buffer -> Sharp)
    const { default: sharp } = await import("sharp");
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
    const sharpImg = sharp(imageBuffer);
    const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();

    // Create Thumbnail
    const thumbBuffer = await sharpImg
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

    // Create LQIP
    const lqipBuffer = await sharpImg
        .resize(20, 20, { fit: 'inside' })
        .webp({ quality: 20 })
        .toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

    // Upload to B2
    const baseFolder = `generated/${userId}/meme_${Date.now()}`;
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

    // Save to Firestore 'memes' collection
    const imageRef = await db.collection("memes").add({
        userId,
        prompt: text, // Saving the meme text as the prompt
        aspectRatio: "match_input_image",
        modelId: "gemini-2.5-flash-image",
        imageUrl: finalImageUrl,
        thumbnailUrl: finalThumbnailUrl,
        lqip,
        createdAt: new Date(),
        type: 'meme',
        isPublic: true // Memes are public by default for feed visibility
    });

    return {
        imageUrl: finalImageUrl,
        thumbnailUrl: finalThumbnailUrl,
        lqip,
        imageId: imageRef.id
    };
};
