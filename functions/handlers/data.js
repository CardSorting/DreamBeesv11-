import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { handleError } from "../lib/utils.js";

export const handleGetGenerationHistory = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const { limit: l = 20, startAfterId } = request.data;
    try {
        let q = db.collection('generation_queue').where('userId', '==', uid).where('status', '==', 'completed').orderBy('createdAt', 'desc').limit(l);
        if (startAfterId) {
            const doc = await db.collection('generation_queue').doc(startAfterId).get();
            if (doc.exists) q = q.startAfter(doc);
        }
        const snap = await q.get();
        const jobs = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt })).filter(j => j.hidden !== true);
        return { jobs, lastVisibleId: snap.docs[snap.docs.length - 1]?.id, hasMore: snap.size === l };
    } catch (_) { throw handleError(_, { uid }); }
};

export const handleGetImageDetail = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new Error("Unauthenticated");
    try {
        let doc = await db.collection('images').doc(request.data.imageId).get();
        let type = 'image';
        if (!doc.exists) { doc = await db.collection('videos').doc(request.data.imageId).get(); type = 'video'; }
        if (!doc.exists) throw new Error("Not found");
        if (doc.data().userId !== uid) throw new Error("Unauthorized");
        const d = doc.data();
        return { id: doc.id, ...d, type, imageUrl: type === 'video' ? (d.imageSnapshotUrl || d.thumbnailUrl || d.videoUrl) : d.imageUrl, createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleGetUserImages = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const { limit: l = 24, startAfterId } = request.data;
    try {
        let iQ = db.collection('images').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(l);
        let vQ = db.collection('videos').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(l);

        if (startAfterId) {
            const iDoc = await db.collection('images').doc(startAfterId).get();
            if (iDoc.exists) { iQ = iQ.startAfter(iDoc); vQ = vQ.where('createdAt', '<', iDoc.data().createdAt); }
            else {
                const vDoc = await db.collection('videos').doc(startAfterId).get();
                if (vDoc.exists) { vQ = vQ.startAfter(vDoc); iQ = iQ.where('createdAt', '<', vDoc.data().createdAt); }
            }
        }
        const [iRes, vRes] = await Promise.allSettled([iQ.get(), vQ.get()]);
        const items = [...(iRes.status === 'fulfilled' ? iRes.value.docs.map(d => ({ ...d.data(), id: d.id, type: 'image' })) : []),
        ...(vRes.status === 'fulfilled' ? vRes.value.docs.map(d => ({ ...d.data(), id: d.id, type: 'video', imageUrl: d.data().imageSnapshotUrl || d.data().videoUrl })) : [])]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, l);

        return { images: items.map(i => ({ ...i, createdAt: i.createdAt?.toDate?.()?.toISOString() || i.createdAt })), lastVisibleId: items[items.length - 1]?.id, hasMore: items.length === l };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleRateGeneration = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new Error("Unauthenticated");
    const { jobId, rating } = request.data;
    try {
        const jobRef = db.collection('generation_queue').doc(jobId);
        const job = await jobRef.get();
        if (!job.exists || job.data().userId !== uid) throw new HttpsError('permission-denied', "Unauthorized");
        const update = { rating: rating?.score || rating, rating_v2: typeof rating === 'object' ? rating : { score: rating }, hidden: rating === -1, ratedAt: FieldValue.serverTimestamp() };
        await jobRef.update(update);
        if (job.data().resultImageId) await db.collection('images').doc(job.data().resultImageId).update(update);
        return { success: true };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleRateShowcaseImage = async (request) => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated', "Auth required");
    try {
        await db.collection('model_showcase_images').doc(request.data.imageId).update({ likesCount: FieldValue.increment(request.data.rating), lastRatedAt: FieldValue.serverTimestamp() });
        return { success: true };
    } catch (e) { throw handleError(e, { uid: request.auth?.uid }); }
};

export const handleDeleteImage = async (request) => {
    if (!request.auth?.uid) throw new Error("Unauthenticated");
    try {
        const doc = await db.collection('images').doc(request.data.imageId).get();
        if (doc.exists && doc.data().userId === request.auth.uid) {
            const data = doc.data();
            // Discard promise - fire and forget cleanup task
            getFunctions().taskQueue('workers-universalWorker').enqueue({
                taskType: 'cleanup-resource',
                cleanupType: 'image',
                imageId: doc.id,
                imageUrl: data.imageUrl,
                thumbnailUrl: data.thumbnailUrl
            }).catch(err => console.error("Failed to enqueue cleanup", err));

            await doc.ref.delete();
        } else {
            throw new Error("Unauthorized or not found");
        }
        return { success: true };
    } catch (e) { throw handleError(e, { uid: request.auth?.uid }); }
};

export const handleDeleteImagesBatch = async (request) => {
    if (!request.auth?.uid) throw new Error("Unauthenticated");
    const { imageIds } = request.data;
    try {
        if (imageIds.length > 50) throw new Error("Max 50");
        const batch = db.batch();
        const docs = await Promise.all(imageIds.map(id => db.collection('images').doc(id).get()));
        const vidDocs = await Promise.all(imageIds.map(id => db.collection('videos').doc(id).get()));

        const queue = getFunctions().taskQueue('workers-universalWorker');

        let sent = 0;
        const allDocs = [...docs, ...vidDocs];

        for (const d of allDocs) {
            if (d.exists && d.data().userId === request.auth.uid) {
                batch.delete(d.ref);
                sent++;

                // Fire and forget cleanup
                const data = d.data();
                const isVideo = !!data.videoUrl;

                queue.enqueue({
                    taskType: 'cleanup-resource',
                    cleanupType: isVideo ? 'video' : 'image',
                    [isVideo ? 'videoId' : 'imageId']: d.id,
                    imageUrl: data.imageUrl,
                    thumbnailUrl: data.thumbnailUrl,
                    videoUrl: data.videoUrl
                }).catch(err => console.error("Failed to enqueue batch cleanup", err));
            }
        }
        await batch.commit();
        return { success: true, deleted: sent };
    } catch (error) { throw handleError(error, { uid: request.auth.uid }); }
};

export const handleToggleBookmark = async (request) => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated', "Auth required");
    const { imageId, isBookmarked, imgData } = request.data;
    try {
        const ref = db.collection('users').doc(request.auth.uid).collection('bookmarks').doc(imageId);
        const imgRef = db.collection('model_showcase_images').doc(imageId);
        if (isBookmarked) { await ref.delete(); await imgRef.update({ bookmarksCount: FieldValue.increment(-1) }); }
        else {
            await ref.set({ imageId, ...imgData, createdAt: FieldValue.serverTimestamp() });
            await imgRef.update({ bookmarksCount: FieldValue.increment(1) });
        }
        return { success: true };
    } catch { throw new HttpsError('internal', "Failed"); }
};
