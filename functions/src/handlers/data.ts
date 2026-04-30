import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { handleError } from "../lib/utils.js";
import { RequestWithAuth } from "../types/functions.js";
import { ensureUserExists } from "../lib/user.js";
import e from "cors";

export const handleGetGenerationHistory = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "Auth required"); }
    const { limit: l = 20, startAfterId } = request.data;
    try {
        let q = db.collection('generation_queue').where('userId', '==', uid).where('status', '==', 'completed').orderBy('createdAt', 'desc').limit(l);
        if (startAfterId) {
            const doc = await db.collection('generation_queue').doc(startAfterId).get();
            if (doc.exists) { q = q.startAfter(doc); }
        }
        const snap = await q.get();
        const jobs = snap.docs.map(d => {
            const data = d.data() as any;
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
            };
        }).filter(j => j.hidden !== true);
        return { jobs, lastVisibleId: snap.docs[snap.docs.length - 1]?.id, hasMore: snap.size === l };
    } catch (_) { throw handleError(_, { uid }); }
};

export const handleGetImageDetail = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new Error("Unauthenticated"); }
    try {
        let doc = await db.collection('images').doc(request.data.imageId).get();
        let type = 'image';
        if (!doc.exists) { throw new Error("Not found"); }
        const d = doc.data() as any;
        if (d.userId !== uid) { throw new Error("Unauthorized"); }
        return { id: doc.id, ...d, type, imageUrl: d.imageUrl, createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleGetUserImages = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "Auth required"); }
    const { limit: l = 24, startAfterId, filter = 'all' } = request.data;

    try {
        let iQ: any = db.collection('images').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(l);

        return {
            images: items.map(i => ({ ...i, createdAt: i.createdAt?.toDate?.()?.toISOString() || i.createdAt })),
            lastVisibleId: items[items.length - 1]?.id,
            lastVisibleType: 'images',
            hasMore: items.length === l
        };
    } catch (e) { throw handleError(e, { uid }); }
};





export const handleDeleteImage = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new Error("Unauthenticated"); }
    try {
        const doc = await db.collection('images').doc(request.data.imageId).get();
        if (doc.exists) {
            const data = doc.data() as any;
            if (data.userId === uid) {
                getFunctions().taskQueue('locations/us-central1/functions/backgroundWorker').enqueue({
                    taskType: 'cleanup-resource',
                    cleanupType: 'image',
                    imageId: doc.id,
                    imageUrl: data.imageUrl,
                    thumbnailUrl: data.thumbnailUrl
                }).catch(err => console.error("Failed to enqueue cleanup", err));

                await doc.ref.delete();
            } else {
                throw new Error("Unauthorized");
            }
        } else {
            throw new Error("Not found");
        }
        return { success: true };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleDeleteImagesBatch = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new Error("Unauthenticated"); }
    const { imageIds } = request.data;
    try {
        if (imageIds.length > 50) { throw new Error("Max 50"); }
        const batch = db.batch();
        const docs = await Promise.all(imageIds.map(id => db.collection('images').doc(id).get()));

        const queue = getFunctions().taskQueue('locations/us-central1/functions/backgroundWorker');

        let sent = 0;
        for (const d of docs) {
            const data = d.data() as any;
            if (d.exists && data.userId === uid) {
                batch.delete(d.ref);
                sent++;

                queue.enqueue({
                    taskType: 'cleanup-resource',
                    cleanupType: 'image',
                    imageId: d.id,
                    imageUrl: data.imageUrl,
                    thumbnailUrl: data.thumbnailUrl
                }).catch(err => console.error("Failed to enqueue batch cleanup", err));
            }
        }
        await batch.commit();
        return { success: true, deleted: sent };
    } catch (error) { throw handleError(error, { uid }); }
};


