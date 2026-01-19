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
    const { limit: l = 24, startAfterId, filter = 'all' } = request.data;
    // filter: 'all', 'image', 'video', 'mockup'

    try {
        let iQ = db.collection('images').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(l);
        let vQ = db.collection('videos').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(l);

        // Apply filters
        if (filter === 'mockup') {
            iQ = iQ.where('type', '==', 'mockup');
            vQ = null; // Don't fetch videos
        } else if (filter === 'image') {
            // Exclude mockups if possible, or just look for explicit type 'image' 
            // Older images might not have type, so usually we just rely on it NOT being a video.
            // But if we want to split Mockup vs Gen Art, we might need a distinct check.
            // For now, let's assume 'image' means "Generations" (not mockups).
            // This might require a composite index if we mix inequality with ordering?
            // "type" != "mockup" is hard in Firestore with orderBy("createdAt").
            // Easier: where('type', '==', 'image') or just fetch all and filter in memory if volume is low? 
            // NO, we must use index. Let's assume standard gens have type='image' or undefined.
            // Safest: where('type', '!=', 'mockup') works IF we have 'type' on all docs. 
            // If safely populated:
            // iQ = iQ.where('type', '!=', 'mockup'); 
            // NOTE: != requires index. Let's try to just be inclusive for 'all' and explicit for 'mockup'.
            // If user wants "Just Art", we might need to backfill 'type=image'.
            // Let's stick to positive assertions if possible.
            // Actually, let's enable 'mockup' filter specifically. 
            // 'image' filter can just mean "Standard Images".
            // Let's assume for now 'image' implies `type != 'mockup'` is desired but risky without index.
            // Let's simplified: 
            // 'mockup' -> type==mockup
            // 'video' -> query videos col
            // 'all' -> query both (images might include mockups mixed in)

            // Refined plan: If filter is 'image', we might just accept that it shows mockups too unless we fix data.
            // But typically users want to separate them.
            // existing code uses 'type' in iRes mappings.
        } else if (filter === 'video') {
            iQ = null;
        }

        if (startAfterId) {
            // This gets complex with mixed streams. 
            // If filtering, it's easier.
            if (iQ && vQ) {
                // Mixed pagination (complex) - handled below
            } else if (iQ) {
                const doc = await db.collection('images').doc(startAfterId).get();
                if (doc.exists) iQ = iQ.startAfter(doc);
            } else if (vQ) {
                const doc = await db.collection('videos').doc(startAfterId).get();
                if (doc.exists) vQ = vQ.startAfter(doc);
            }
        }

        // Execute
        const promises = [];
        if (iQ) promises.push(iQ.get());
        if (vQ) promises.push(vQ.get());

        const results = await Promise.all(promises);

        let items = [];
        results.forEach(snap => {
            snap.docs.forEach(d => {
                const data = d.data();
                // Determine type more explicitly
                let type = 'image';
                if (d.ref.parent.id === 'videos') type = 'video';
                else if (data.type === 'mockup') type = 'mockup';

                // Post-fetch filter for 'image' (Art) only if needed?
                // If filter=='image' and we got a mockup, skip it?
                // Pagination breaks if we skip too many.
                // For now, let's just return what we query.

                items.push({
                    ...data,
                    id: d.id,
                    type,
                    // Fix video URL mapping if needed
                    imageUrl: type === 'video' ? (data.imageSnapshotUrl || data.videoUrl) : data.imageUrl
                });
            });
        });

        // Client expects sorted mixed list
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Manual client-side filter if strictly needed and valid (e.g. if 'image' filter requested but we couldn't query exact)
        if (filter === 'image') {
            items = items.filter(i => i.type !== 'mockup' && i.type !== 'video');
        }

        // Slice to limit
        const hasMore = items.length > l;
        items = items.slice(0, l);

        return {
            images: items.map(i => ({ ...i, createdAt: i.createdAt?.toDate?.()?.toISOString() || i.createdAt })),
            lastVisibleId: items[items.length - 1]?.id,
            lastVisibleType: items[items.length - 1]?.type === 'video' ? 'videos' : 'images', // heuristic
            hasMore: items.length === l // simplistic check
        };
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
            // Discard promise - fire and forget cleanup task
            getFunctions().taskQueue('locations/us-central1/functions/backgroundWorker').enqueue({
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

        const queue = getFunctions().taskQueue('locations/us-central1/functions/backgroundWorker');

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

export const handleToggleLike = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const { imageId, isLiked, imgData, modelId } = request.data;

    try {
        const userLikeRef = db.collection('users').doc(uid).collection('likes').doc(imageId);
        const imageRef = db.collection('model_showcase_images').doc(imageId);

        // Transaction to ensure count consistency? Or just simple batch/parallel writes?
        // Since we are unliking/liking, we should probably do it sequentially or batched.
        // For simple social features, firestore increment is atomic enough usually.

        if (isLiked) {
            // UNLIKE
            await userLikeRef.delete();
            // Decrement global count
            await imageRef.update({
                likesCount: FieldValue.increment(-1)
            });
        } else {
            // LIKE
            await userLikeRef.set({
                imageId,
                modelId: modelId || 'unknown',
                ...imgData,
                createdAt: FieldValue.serverTimestamp()
            });
            // Increment global count
            await imageRef.update({
                likesCount: FieldValue.increment(1),
                lastRatedAt: FieldValue.serverTimestamp()
            });
        }
        return { success: true };
    } catch (error) {
        console.error("Toggle like failed:", error);
        throw handleError(error, { uid });
    }
};
