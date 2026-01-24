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

        // --- STAGE 1: Visual Grammar & Grammar DNA ---
        const dnaPrompt = `
            You are a lead NFT Art Director defining a "Visual Grammar" for a 30-item PFP collection.
            Theme: "${theme}"
            Style: "${style}"
            
            1. Define Collection DNA: Palette (5 hex), "Forbidden Material" (Legendary only), and "Visual Signature" (e.g., 45-degree harsh shadows, holographic grain).
            2. Define "Visual Grammar Rules": 
               - Silhouette constraints (e.g., "tall headgear," "compact collars").
               - Material Affinities (e.g., "Liquid" traits must always pair with "Glow" effects).

            Return a strict JSON:
            {
                "grammar": { "palette": [], "forbidden_material": "string", "signature": "string", "rules": [] },
                "material_affinities": { "materialA": ["trait_type1", "trait_type2"], "materialB": [] }
            }
        `;

        const dnaResult = await vertexFlow.execute('GRAMMAR_DNA_COMPILER', async () => {
            return await textModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: dnaPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        const grammarDNA = JSON.parse((await dnaResult.response).candidates[0].content.parts[0].text);

        // --- STAGE 2: 2D Diversity Vector Mapping ---
        const manifestPrompt = `
            Using this Visual Grammar: ${JSON.stringify(grammarDNA)}
            Generate a Manifest for exactly 30 items.
            
            DIVERSITY VECTOR MAPPING:
            Map all items on a 2D plane: X (Chaotic to Structured), Y (Organic to Synthetic). 
            Space them evenly. No two items can share the same vector quadrant AND more than 1 trait.

            JSON Structure per item:
            {
                "id": index,
                "vector": { "x": -1 to 1, "y": -1 to 1 },
                "rarity": "Legendary|Rare|Common",
                "traits": { 
                    "background": "description", 
                    "clothing": "description tied to material affinity",
                    "accessories": "description",
                    "unique_hook": "one-of-a-kind visual deviation"
                }
            }
            Legendary item MUST use the "Forbidden Material" from the DNA.
        `;

        const manifestResult = await vertexFlow.execute('DIVERSITY_MANIFEST_COMPILER', async () => {
            return await textModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: manifestPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        let manifest = JSON.parse((await manifestResult.response).candidates[0].content.parts[0].text);

        // --- STAGE 3: Semantic Critique & Mutation ---
        const critiquePrompt = `
            Review this Diversity Manifest for "Semantic Clustering" (items that feel too similar in mood):
            ${JSON.stringify(manifest)}

            Identify items within 0.2 units of each other on the Diversity Vector Map that share more than 1 semantic descriptor.
            Return a JSON object:
            {
                "mutations": [
                    { "id": index, "mutation_instruction": "Force new X/Y position and reset all traits" }
                ]
            }
        `;

        const critiqueResult = await vertexFlow.execute('DIVERSITY_CRITIQUE', async () => {
            return await textModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: critiquePrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        const critiqueData = JSON.parse((await critiqueResult.response).candidates[0].content.parts[0].text);

        // Handle mutations (simplified for this call)
        if (critiqueData.mutations) {
            // Note: In production we'd re-call textModel for the mutated rows, here we trust the critique logic.
            critiqueData.mutations.forEach(mut => {
                const idx = manifest.findIndex(m => m.id === mut.id);
                if (idx !== -1) manifest[idx].mutated = true;
            });
        }

        // --- STAGE 4: Image Generation Flow (Master + 29 Evolutions) ---
        const masterDef = manifest[0];
        const masterPrompt = `
            ULTIMATE Masterpiece PFP. Chest up. ${theme} Theme. ${style} Style.
            DNA: Silhouette: ${grammarDNA.grammar.signature}. Palette: ${grammarDNA.grammar.palette.join(', ')}.
            Vector Position: X=${masterDef.vector.x} (Chaos/Structure), Y=${masterDef.vector.y} (Organic/Synthetic).
            Traits: ${masterDef.traits.background}, ${masterDef.traits.clothing}, ${masterDef.traits.accessories}.
            Unique Hook: ${masterDef.traits.unique_hook}.
            Rarity: ${masterDef.rarity}.
            Consistency Anchor: Hyper-detailed character face, 8k resolution, cinematic focus.
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
                DIVERSITY EVOLUTION SEQUENCE:
                REFERENCE: Strictly maintain this character face, quality, and art style.
                NEW SEMANTIC VECTOR: X=${def.vector.x}, Y=${def.vector.y}.
                NEW FEATURES (${def.rarity}):
                - Hook: ${def.traits.unique_hook}
                - Outfit/Base: ${def.traits.clothing}
                - BG: ${def.traits.background}
                - Details: ${def.traits.accessories}
                Ensure the visual entropy is high compared to the reference, but character remains identical.
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

        // --- STAGE 5: Storage & Persistence ---
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
                vector: img.definition.vector,
                traits: img.definition.traits
            };
        }));

        const collectionRef = db.collection('avatar_collections').doc();
        await collectionRef.set({
            userId: uid, userDisplayName, name: theme,
            images: processedImages, minted: false,
            grammarDNA,
            createdAt: FieldValue.serverTimestamp(),
            stats: { floorPrice: (Math.random() * 2).toFixed(2), totalVolume: 0, owners: 0, items: processedImages.length }
        });

        return { collectionId: collectionRef.id };

    } catch (error) {
        throw handleError(error, { uid });
    }
};

export const handleMintCollection = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { collectionId } = request.data;
    const CLAIM_COST = 5;

    try {
        const collectionRef = db.collection('avatar_collections').doc(collectionId);
        const userRef = db.collection('users').doc(uid);

        return await db.runTransaction(async (t) => {
            const [collDoc, userDoc] = await Promise.all([t.get(collectionRef), t.get(userRef)]);
            if (!collDoc.exists) throw new HttpsError('not-found', "Drop not found");
            const collData = collDoc.data();
            if (collData.userId !== uid) throw new HttpsError('permission-denied', "Not your drop");
            if (collData.minted) throw new HttpsError('failed-precondition', "Already claimed");

            if ((userDoc.data()?.zaps || 0) < CLAIM_COST) throw new HttpsError('resource-exhausted', "Insufficient Zaps");

            t.update(userRef, { zaps: FieldValue.increment(-CLAIM_COST) });
            t.update(collectionRef, { minted: true, 'stats.owners': FieldValue.increment(1) });

            collData.images.forEach(img => {
                t.set(db.collection('images').doc(), {
                    userId: uid, imageUrl: img.url, thumbnailUrl: img.thumbnailUrl,
                    createdAt: FieldValue.serverTimestamp(), type: 'avatar', collectionId, minted: true,
                    rarity: img.rarity, vector: img.vector, traits: img.traits
                });
            });

            return { success: true };
        });
    } catch (error) { throw handleError(error, { uid, collectionId }); }
};
