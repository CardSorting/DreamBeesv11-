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

        // --- STAGE 1: Visual DNA & Archetype Mapping ---
        const dnaPrompt = `
            You are a lead NFT Architect for a 30-item PFP collection.
            Theme: "${theme}"
            Style: "${style}"
            
            1. Define the Visual DNA: Palette (4-5 hex), Material Themes, and Signature Texture.
            2. Split this collection into 6 "Aesthetic Archetypes" (e.g., Heavy Tech, Ghost, Neon Noir, Minimalist, Primal, etc.).
            3. For each Archetype, define 2-3 exclusive traits patterns.

            Return a strict JSON object:
            {
                "dna": { "palette": [], "materials": "string", "texture": "string" },
                "archetypes": [
                    { "name": "...", "mood": "...", "exclusive_traits": [] }
                ]
            }
        `;

        const dnaResult = await vertexFlow.execute('DNA_ARCHETYPE_COMPILER', async () => {
            return await textModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: dnaPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        const collectionStructure = JSON.parse((await dnaResult.response).candidates[0].content.parts[0].text);

        // --- STAGE 2: Permutative Manifest Generation ---
        const manifestPrompt = `
            Using this Collection Structure: ${JSON.stringify(collectionStructure)}
            Generate a Manifest for exactly 30 items.
            - Assign 5 items to each of the 6 Archetypes.
            - Include Rarity Tiers: 1 Legendary, 5 Rare, 24 Common.
            - Every item MUST have a "unique_hook" (a one-of-a-kind visual detail).

            Return a JSON array of 30 "Draft" Manifest items:
            {
                "id": index,
                "archetype": "string",
                "rarity": "string",
                "traits": { "clothing": "description", "headgear": "description", "eyes": "description", "unique_hook": "description" }
            }
        `;

        const manifestResult = await vertexFlow.execute('MANIFEST_DRAFT_COMPILER', async () => {
            return await textModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: manifestPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        let draftManifest = JSON.parse((await manifestResult.response).candidates[0].content.parts[0].text);

        // --- STAGE 3: Self-Collision Critique & Mutation ---
        const critiquePrompt = `
            You are a lead Quality Controller. Review this draft PFP Manifest for visual repetition:
            ${JSON.stringify(draftManifest)}

            Identify any pairs of items that share too many similar traits or feeling.
            Return a JSON object:
            {
                "mutations": [
                    { "id": index, "reason": "too similar to item X", "new_traits": { ... } }
                ]
            }
            If any item feels "generic," force a more exotic "unique_hook."
        `;

        const critiqueResult = await vertexFlow.execute('MANIFEST_CRITIQUE', async () => {
            return await textModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: critiquePrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        const critiqueData = JSON.parse((await critiqueResult.response).candidates[0].content.parts[0].text);

        // Apply Mutations
        if (critiqueData.mutations) {
            critiqueData.mutations.forEach(mut => {
                const index = draftManifest.findIndex(item => item.id === mut.id);
                if (index !== -1) {
                    draftManifest[index].traits = { ...draftManifest[index].traits, ...mut.new_traits };
                    draftManifest[index].mutated = true;
                    draftManifest[index].critique_reason = mut.reason;
                }
            });
        }

        // --- STAGE 4: Image Generation Flow (Master + 29 Evolutions) ---
        const masterDef = draftManifest[0];
        const masterPrompt = `
            Masterpiece Profile Picture. Chest up. ${theme} Theme. ${style} Style.
            Archetype: ${masterDef.archetype}. Rarity: ${masterDef.rarity}.
            Visual DNA: Palette: ${collectionStructure.dna.palette.join(', ')}. Materials: ${collectionStructure.dna.materials}.
            Archetype Traits: ${masterDef.traits.clothing}, ${masterDef.traits.headgear}, ${masterDef.traits.eyes}.
            Unique Detail: ${masterDef.traits.unique_hook}.
            Consistency Anchor: Ultra-detailed face, cinematic lighting, sharp focus.
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

        for (let i = 1; i < draftManifest.length; i++) {
            const def = draftManifest[i];
            await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));

            const evolutionPrompt = `
                ACT AS AN IMAGE EVOLVER.
                MAINTAIN: Same character face, cinematic quality, and artistic style from reference.
                NEW ARCHETYPE: ${def.archetype} (${def.rarity}).
                NEW TRAITS: 
                - Costume: ${def.traits.clothing}
                - Eyes/Face: ${def.traits.eyes}
                - Hook: ${def.traits.unique_hook}
                - Atmosphere: ${def.traits.headgear}
                Ensure ${def.archetype} visual identity is strong.
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

        // --- STAGE 5: Processing & Persistence ---
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
                archetype: img.definition.archetype,
                traits: img.definition.traits
            };
        }));

        const collectionRef = db.collection('avatar_collections').doc();
        await collectionRef.set({
            userId: uid, userDisplayName, name: theme,
            images: processedImages, minted: false,
            dna: collectionStructure.dna,
            archetypes: collectionStructure.archetypes,
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
                    rarity: img.rarity, archetype: img.archetype, traits: img.traits
                });
            });

            return { success: true };
        });
    } catch (error) { throw handleError(error, { uid, collectionId }); }
};
