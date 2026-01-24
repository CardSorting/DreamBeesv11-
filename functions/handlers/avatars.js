import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "../firebaseInit.js";
import { handleError, logger } from "../lib/utils.js";
import { vertexFlow } from "../lib/vertexFlow.js";
import { VertexAI } from "@google-cloud/vertexai";

const RATE_LIMIT_DELAY = 6000;

export const handleGenerateAvatarCollection = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { theme, style, referenceImage, referenceImageMimeType } = request.data;
    if (!theme && !style) throw new HttpsError('invalid-argument', "Theme or Style required");

    const COST = 5;
    const TARGET_COUNT = 30;

    try {
        const userRef = db.collection('users').doc(uid);
        let userDisplayName = "DreamBees User";

        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const userData = userDoc.data();
            if ((userData.zaps || 0) < COST) throw new HttpsError('resource-exhausted', `Insufficient Zaps.`);
            userDisplayName = userData.displayName || userData.username || "DreamBees User";
            t.update(userRef, { zaps: FieldValue.increment(-COST) });
        });

        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const textModel = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const imageModel = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

        // --- STAGE 1: Character Identity Sheet ---
        const identityPrompt = `
            Define a strict, non-negotiable "Character Identity Sheet" for a 30-item PFP collection.
            Theme: "${theme}"
            Style: "${style}"
            
            Return a JSON object:
            {
                "identity": {
                    "face_geometry": "e.g., high cheekbones, sharp jawline",
                    "eye_logic": "e.g., wide spacing, specific iris pattern",
                    "skin_signature": "e.g., porcelain matte with micro-etched circuits",
                    "personality_mood": "e.g., stoic, melancholic, ethereal"
                },
                "dna": { "palette": ["hex"], "signature_lighting": "string" }
            }
        `;

        const idResult = await vertexFlow.execute('IDENTITY_COMPILER', async () => {
            return await textModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: identityPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        const idData = JSON.parse((await idResult.response).candidates[0].content.parts[0].text);

        // --- STAGE 2: Atomic Syllable Pool ---
        const syllablePrompt = `
            Using this Identity: ${JSON.stringify(idData)}
            Generate an "Atomic Syllable Pool" for trait generation.
            Break traits into Syllables: [Base Shape] + [Material] + [Finish] + [Detail].
            
            Return a JSON object with pools for:
            - Clothing_Syllables: { shapes: [], materials: [], finishes: [], details: [] }
            - Headgear_Syllables: { shapes: [], materials: [], finishes: [], details: [] }
            - Background_Syllables: { environments: [], atmospheres: [] }
        `;

        const syllableResult = await vertexFlow.execute('SYLLABLE_POOL_COMPILER', async () => {
            return await textModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: syllablePrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        const syllablePool = JSON.parse((await syllableResult.response).candidates[0].content.parts[0].text);

        // --- STAGE 3: Combinatorial Manifest Matrix ---
        const matrixPrompt = `
            Using the Syllable Pool: ${JSON.stringify(syllablePool)}
            And the Identity: ${JSON.stringify(idData.identity)}
            Generate a Manifest for exactly 30 unique items.
            Ensuring NO two items share more than one complete Syllable combination.
            Include 1 Legendary, 5 Rare, 24 Common items.

            Return a JSON array of 30 "Atomic Manifest" items:
            {
                "id": index,
                "rarity": "string",
                "syllables": { 
                    "clothing": "Shape + Material + Finish + Detail",
                    "headgear": "Shape + Material + Finish + Detail",
                    "background": "Env + Atmosphere"
                },
                "unique_deviation": "one-at-a-time special trait"
            }
        `;

        const matrixResult = await vertexFlow.execute('MATRIX_COMPILER', async () => {
            return await textModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: matrixPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        const manifest = JSON.parse((await matrixResult.response).candidates[0].content.parts[0].text);

        // --- STAGE 4: Image Generation Flow ---
        const masterDef = manifest[0];
        const masterPrompt = `
            Subject: PFP chest-up. ${theme} Theme. ${style} Style.
            IDENTITY ANCHOR (STRICT): Face=${idData.identity.face_geometry}. Eyes=${idData.identity.eye_logic}. Skin=${idData.identity.skin_signature}. Mood=${idData.identity.personality_mood}.
            TRAITS: Clothing=${masterDef.syllables.clothing}. Headgear=${masterDef.syllables.headgear}. BG=${masterDef.syllables.background}.
            UNIQUE HOOK: ${masterDef.unique_deviation}.
            Ultra-detailed, cinematic masterpiece. Consistency is mandatory.
        `;

        const masterParts = [{ text: masterPrompt }];
        if (referenceImage) {
            masterParts.unshift({
                inlineData: {
                    data: referenceImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, ''),
                    mimeType: referenceImageMimeType || 'image/png'
                }
            });
        }

        const masterResult = await vertexFlow.execute('MASTER_PFP', async () => {
            return await imageModel.generateContent({ contents: [{ role: 'user', parts: masterParts }] });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        const masterBase64 = (await masterResult.response).candidates[0].content.parts.find(p => p.inlineData).inlineData.data;
        const generatedImages = [{ base64: masterBase64, prompt: masterPrompt, definition: masterDef }];

        for (let i = 1; i < manifest.length; i++) {
            const def = manifest[i];
            await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));

            const evolutionPrompt = `
                IDENTITY-ANCHORED EVOLUTION:
                REFERENCE: Lock onto this character's IDENTICAL FACE and STYLE.
                STRICT IDENTITY: ${JSON.stringify(idData.identity)}
                NEW ATOMIC TRAITS: 
                - Outfit: ${def.syllables.clothing}
                - Environment: ${def.syllables.background}
                - Special: ${def.unique_deviation}
                Maintain the persona perfectly while changing the setup.
            `;

            try {
                const evoResult = await vertexFlow.execute(`EVO_${i}`, async () => {
                    return await imageModel.generateContent({
                        contents: [{
                            role: 'user',
                            parts: [{ inlineData: { data: masterBase64, mimeType: 'image/png' } }, { text: evolutionPrompt }]
                        }]
                    });
                }, vertexFlow.constructor.PRIORITY.NORMAL);

                const base64 = (await evoResult.response).candidates[0].content.parts.find(p => p.inlineData).inlineData.data;
                generatedImages.push({ base64, prompt: evolutionPrompt, definition: def });
            } catch (err) { logger.error(`Evo ${i} failed`, err); }
        }

        // --- STAGE 5: Persistence ---
        const { default: sharp } = await import("sharp");
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const { getS3Client } = await import("../lib/utils.js");
        const { B2_BUCKET, B2_PUBLIC_URL } = await import("../lib/constants.js");
        const s3 = await getS3Client();

        const processedImages = await Promise.all(generatedImages.map(async (img, idx) => {
            const buffer = Buffer.from(img.base64, 'base64');
            const sharpImg = sharp(buffer);
            const [webp, thumb] = await Promise.all([
                sharpImg.webp({ quality: 90 }).toBuffer(),
                sharpImg.resize(512, 512).webp({ quality: 80 }).toBuffer()
            ]);
            const key = `generated/${uid}/avatar_${Date.now()}_${idx}`;
            await s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: `${key}.webp`, Body: webp, ContentType: "image/webp" }));
            await s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: `${key}_t.webp`, Body: thumb, ContentType: "image/webp" }));

            return {
                url: `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${key}.webp`,
                thumbnailUrl: `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${key}_t.webp`,
                rarity: img.definition.rarity,
                syllables: img.definition.syllables,
                unique_deviation: img.definition.unique_deviation
            };
        }));

        const collectionRef = db.collection('community_avatar_pool').doc();
        const batch = db.batch();

        processedImages.forEach((img, idx) => {
            const imgRef = db.collection('community_avatar_pool').doc();
            batch.set(imgRef, {
                ...img,
                requestedBy: uid,
                userDisplayName,
                theme,
                style,
                minted: false,
                random: Math.random(),
                createdAt: FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        return { success: true, count: processedImages.length };

    } catch (error) {
        throw handleError(error, { uid });
    }
};

export const handleMintRandomAvatar = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const MINT_COST = 2; // User didn't specify, but let's set a small cost for gachapon

    try {
        const userRef = db.collection('users').doc(uid);
        const poolRef = db.collection('community_avatar_pool');

        return await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            if ((userDoc.data()?.zaps || 0) < MINT_COST) throw new HttpsError('resource-exhausted', "Insufficient Zaps");

            // Efficient random selection: Pick a random float and find the first doc >= it
            const randomVal = Math.random();
            const q = poolRef.where('minted', '==', false).where('random', '>=', randomVal).limit(1);
            let poolSnap = await t.get(q);

            // Fallback if no doc >= random (loop around)
            if (poolSnap.empty) {
                const qFallback = poolRef.where('minted', '==', false).where('random', '<', randomVal).limit(1);
                poolSnap = await t.get(qFallback);
            }

            if (poolSnap.empty) {
                throw new HttpsError('failed-precondition', "No available avatars in the community pool. Forge some first!");
            }

            const avatarDoc = poolSnap.docs[0];
            const avatarData = avatarDoc.data();

            // 1. Update pool doc
            t.update(avatarDoc.ref, {
                minted: true,
                ownerId: uid,
                mintedAt: FieldValue.serverTimestamp()
            });

            // 2. Add to user's personal images collection
            const userImageRef = db.collection('images').doc();
            t.set(userImageRef, {
                userId: uid,
                imageUrl: avatarData.url,
                thumbnailUrl: avatarData.thumbnailUrl,
                type: 'avatar',
                rarity: avatarData.rarity,
                syllables: avatarData.syllables,
                collectionName: avatarData.theme, // Back-compat or display
                minted: true,
                createdAt: FieldValue.serverTimestamp()
            });

            // 3. Deduct Zaps
            t.update(userRef, { zaps: FieldValue.increment(-MINT_COST) });

            return {
                success: true,
                prize: {
                    url: avatarData.url,
                    thumbnailUrl: avatarData.thumbnailUrl,
                    theme: avatarData.theme,
                    rarity: avatarData.rarity
                }
            };
        });
    } catch (error) {
        throw handleError(error, { uid });
    }
};
