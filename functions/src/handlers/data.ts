import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { handleError } from "../lib/utils.js";
import { ImpactService } from "../lib/impact.js";
import { RequestWithAuth } from "../types/functions.js";
import { ensureUserExists } from "../lib/user.js";
import { ReputationService } from "../lib/reputation.js";
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

        if (filter === 'mockup') {
            iQ = iQ.where('type', '==', 'mockup');
        }

        if (startAfterId) {
            const doc = await db.collection('images').doc(startAfterId).get();
            if (doc.exists) { iQ = iQ.startAfter(doc); }
        }

        const snap = await iQ.get();

        let items: any[] = [];
        snap.docs.forEach((d: any) => {
            const data = d.data();
            let type = data.type === 'mockup' ? 'mockup' : 'image';

            items.push({
                ...data,
                id: d.id,
                type,
                imageUrl: data.imageUrl
            });
        });

        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (filter === 'image') {
            items = items.filter(i => i.type !== 'mockup');
        }

        items = items.slice(0, l);

        return {
            images: items.map(i => ({ ...i, createdAt: i.createdAt?.toDate?.()?.toISOString() || i.createdAt })),
            lastVisibleId: items[items.length - 1]?.id,
            lastVisibleType: 'images',
            hasMore: items.length === l
        };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleRateGeneration = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new Error("Unauthenticated"); }
    const { jobId, rating } = request.data;
    try {
        const jobRef = db.collection('generation_queue').doc(jobId);
        const job = await jobRef.get();
        const jobData = job.data() as any;
        if (!job.exists || jobData.userId !== uid) { throw new HttpsError('permission-denied', "Unauthorized"); }
        const update = { rating: rating?.score || rating, rating_v2: typeof rating === 'object' ? rating : { score: rating }, hidden: rating === -1, ratedAt: FieldValue.serverTimestamp() };
        await jobRef.update(update);
        if (jobData.resultImageId) { await db.collection('images').doc(jobData.resultImageId).update(update); }

        // Track impact for high ratings
        const score = rating?.score || rating;
        if (score >= 4) {
            await ImpactService.trackCreationImpact(jobId, 'like');
        }

        return { success: true };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleReportGeneration = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "Auth required"); }
    const { jobId, reason } = request.data;
    const REPORT_THRESHOLD = 3;

    try {
        const jobRef = db.collection('generation_queue').doc(jobId);
        const reportsRef = jobRef.collection('reporters').doc(uid);

        await db.runTransaction(async (t) => {
            const reportDoc = await t.get(reportsRef);
            if (reportDoc.exists) { return; }

            const jobDoc = await t.get(jobRef);
            if (!jobDoc.exists) { throw new HttpsError('not-found', "Job not found"); }

            const jobData = jobDoc.data() as any;
            const currentReports = (jobData.reportCount || 0) + 1;
            const shouldHide = currentReports >= REPORT_THRESHOLD;

            t.set(reportsRef, {
                uid,
                reason: reason || 'unspecified',
                createdAt: FieldValue.serverTimestamp()
            });

            t.update(jobRef, {
                reportCount: currentReports,
                hidden: shouldHide,
                lastReportedAt: FieldValue.serverTimestamp()
            });

            if (shouldHide && jobData.resultImageId) {
                t.update(db.collection('images').doc(jobData.resultImageId), {
                    hidden: true
                });
            }
        });

        return { success: true };
    } catch (e) {
        throw handleError(e, { uid });
    }
};

export const handleAppealGeneration = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "Auth required"); }
    const { jobId } = request.data;

    try {
        const jobRef = db.collection('generation_queue').doc(jobId);

        await db.runTransaction(async (t) => {
            const jobDoc = await t.get(jobRef);
            if (!jobDoc.exists) { throw new HttpsError('not-found', "Job not found"); }
            const jobData = jobDoc.data() as any;
            if (jobData.userId !== uid) {
                throw new HttpsError('permission-denied', "Only the owner can appeal");
            }

            if (jobData.isAppeal) { return; }

            const updateData = {
                moderationScore: 0,
                reportCount: 0,
                hidden: false,
                isAppeal: true,
                lastAppealedAt: FieldValue.serverTimestamp()
            };

            t.update(jobRef, updateData);

            if (jobData.resultImageId) {
                t.update(db.collection('images').doc(jobData.resultImageId), {
                    hidden: false
                });
            }
        });

        return { success: true };
    } catch (e) {
        throw handleError(e, { uid });
    }
};

export const handleModerationVote = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "Auth required"); }
    const { jobId, verdict, confidence = 1 } = request.data;

    if (!['safe', 'unsafe', 'skip'].includes(verdict)) {
        throw new HttpsError('invalid-argument', "Invalid verdict");
    }

    const validConfidence = Math.min(3, Math.max(1, Math.floor(confidence)));
    const confidenceMultiplier = 1 + (validConfidence - 1) * 0.25;

    const HIDE_THRESHOLD = -5;
    const SAFE_THRESHOLD = 5;

    try {
        const jobRef = db.collection('generation_queue').doc(jobId);
        const userRef = db.collection('users').doc(uid);
        const voteRef = jobRef.collection('votes').doc(uid);

        const result: any = { consensus: 'pending', userPower: 1, reputationAwarded: 0 };

        await db.runTransaction(async (t) => {
            const voteDoc = await t.get(voteRef);
            if (voteDoc.exists) { throw new HttpsError('already-exists', "Already voted"); }

            const userDoc = await t.get(userRef);
            const jobDoc = await t.get(jobRef);

            if (!jobDoc.exists) { throw new HttpsError('not-found', "Job not found"); }
            const jobData = jobDoc.data() as any;
            const userData = userDoc.data() as any;

            // Use Isolated Reputation Service
            const reputation = userData?.reputation || 0;
            const votePower = ReputationService.calculateVotePower(reputation, validConfidence);

            if (verdict === 'skip') {
                t.set(voteRef, {
                    uid,
                    verdict,
                    power: 0,
                    confidence: validConfidence,
                    createdAt: FieldValue.serverTimestamp()
                });
                return;
            }

            const currentScore = jobData.moderationScore || 0;
            const scoreChange = verdict === 'safe' ? votePower : -votePower;
            const newScore = currentScore + scoreChange;

            const updates: any = {
                moderationScore: newScore,
                lastModeratedAt: FieldValue.serverTimestamp()
            };

            let consensusReached = false;
            let consensusVerdict: string | null = null;

            if (newScore <= HIDE_THRESHOLD) {
                updates.hidden = true;
                consensusReached = true;
                consensusVerdict = 'unsafe';
            } else if (newScore >= SAFE_THRESHOLD) {
                updates.hidden = false;
                updates.reportCount = 0;
                if (jobData.isAppeal) {
                    updates.isAppeal = false;
                    updates.appealGranted = true;
                }
                consensusReached = true;
                consensusVerdict = 'safe';
            }

            const resultImageId = jobData.resultImageId;
            if (resultImageId) {
                const imgUpdates: any = {};
                if (updates.hidden !== undefined) { imgUpdates.hidden = updates.hidden; }
                if (Object.keys(imgUpdates).length > 0) {
                    t.update(db.collection('images').doc(resultImageId), imgUpdates);
                }
            }

            t.update(jobRef, updates);

            t.set(voteRef, {
                uid,
                verdict,
                power: votePower,
                confidence: validConfidence,
                createdAt: FieldValue.serverTimestamp()
            });

            // Rep Award: Default is 1
            let repAward = 1;

            if (consensusReached && consensusVerdict) {
                try {
                    const queue = getFunctions().taskQueue('locations/us-central1/functions/backgroundWorker');
                    queue.enqueue({
                        taskType: 'process-consensus',
                        jobId,
                        verdict: consensusVerdict
                    }).catch(console.error);

                    if (verdict === consensusVerdict) {
                        repAward += 5; // Direct consensus match bonus
                    }
                } catch (e) { console.error("Failed to enqueue consensus task", e); }
            }

            if (validConfidence === 3) {
                repAward = Math.ceil(repAward * 1.25);
            }

            t.update(userRef, {
                reputation: FieldValue.increment(repAward),
                totalReviews: FieldValue.increment(1),
                lastReviewDate: new Date().toDateString()
            });

            result.userPower = votePower;
            result.reputationAwarded = repAward;
            result.consensus = consensusReached ? consensusVerdict : 'pending';
            result.newScore = newScore;
        });

        return result;

    } catch (e: any) {
        if (e.code === 'already-exists') {
            return { alreadyVoted: true };
        }
        throw handleError(e, { uid });
    }
};

export const handleRateShowcaseImage = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "Auth required"); }
    try {
        await db.collection('model_showcase_images').doc(request.data.imageId).update({
            likesCount: FieldValue.increment(request.data.rating),
            lastRatedAt: FieldValue.serverTimestamp()
        });
        return { success: true };
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

export const handleToggleBookmark = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    const { imageId, isBookmarked, imgData, targetUserId, targetDisplayName, targetPhotoURL } = request.data;
    const callerRole = (request.auth as any).token?.role || 'user';
    const currentUid = (['admin', 'system'].includes(callerRole) && targetUserId) ? targetUserId : uid;

    if (!currentUid) { throw new HttpsError('unauthenticated', "Auth required"); }
    try {
        // --- Hardening: Check if user exists ---
        // Ensure user exists (JIT Provisioning)
        await ensureUserExists(currentUid, targetDisplayName, targetPhotoURL);

        const userDoc = await db.collection("users").doc(currentUid).get();
        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'User does not exist.');
        }
        // --------------------------------------

        const ref = db.collection('users').doc(currentUid).collection('bookmarks').doc(imageId);
        const imgRef = db.collection('model_showcase_images').doc(imageId);
        if (isBookmarked) {
            await ref.delete();
            await imgRef.update({ bookmarksCount: FieldValue.increment(-1) });
        } else {
            await ref.set({ imageId, ...imgData, createdAt: FieldValue.serverTimestamp() });
            await imgRef.update({ bookmarksCount: FieldValue.increment(1) });
        }
        return { success: true };
    } catch { throw new HttpsError('internal', "Failed"); }
};

export const handleToggleLike = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "Auth required"); }
    const { imageId, isLiked, imgData, modelId } = request.data;

    try {
        const userLikeRef = db.collection('users').doc(uid).collection('likes').doc(imageId);
        const imageRef = db.collection('model_showcase_images').doc(imageId);

        if (isLiked) {
            await userLikeRef.delete();
            await imageRef.update({
                likesCount: FieldValue.increment(-1)
            });
        } else {
            await userLikeRef.set({
                imageId,
                modelId: modelId || 'unknown',
                ...imgData,
                createdAt: FieldValue.serverTimestamp()
            });
            await imageRef.update({
                likesCount: FieldValue.increment(1),
                lastRatedAt: FieldValue.serverTimestamp()
            });

            // Track viral impact
            await ImpactService.trackCreationImpact(imageId, 'like');
        }
        return { success: true };
    } catch (error) {
        console.error("Toggle like failed:", error);
        throw handleError(error, { uid });
    }
};
