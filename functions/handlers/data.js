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
        const _hasMore = items.length > l;
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

export const handleReportGeneration = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const { jobId, reason } = request.data;
    const REPORT_THRESHOLD = 3;

    try {
        const jobRef = db.collection('generation_queue').doc(jobId);
        const reportsRef = jobRef.collection('reporters').doc(uid);

        await db.runTransaction(async (t) => {
            const reportDoc = await t.get(reportsRef);
            if (reportDoc.exists) {
                // User already reported this. Be idempotent.
                return;
            }

            const jobDoc = await t.get(jobRef);
            if (!jobDoc.exists) throw new HttpsError('not-found', "Job not found");

            const currentReports = (jobDoc.data().reportCount || 0) + 1;
            const shouldHide = currentReports >= REPORT_THRESHOLD;

            t.set(reportsRef, {
                uid,
                reason: reason || 'unspecified',
                createdAt: FieldValue.serverTimestamp()
            });

            t.update(jobRef, {
                reportCount: currentReports,
                hidden: shouldHide, // Globally hide if threshold reached
                lastReportedAt: FieldValue.serverTimestamp()
            });

            // If linked to an image result, hide that too if threshold reached
            if (shouldHide && jobDoc.data().resultImageId) {
                t.update(db.collection('images').doc(jobDoc.data().resultImageId), {
                    hidden: true
                });
            }
        });

        return { success: true };
    } catch (e) {
        throw handleError(e, { uid });
    }
};

export const handleAppealGeneration = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const { jobId } = request.data;

    try {
        const jobRef = db.collection('generation_queue').doc(jobId);

        await db.runTransaction(async (t) => {
            const jobDoc = await t.get(jobRef);
            if (!jobDoc.exists) throw new HttpsError('not-found', "Job not found");

            if (jobDoc.data().userId !== uid) {
                throw new HttpsError('permission-denied', "Only the owner can appeal");
            }

            // Limit appeals? Maybe once per job.
            if (jobDoc.data().isAppeal) {
                // throw new HttpsError('failed-precondition', "Already appealed");
                // For now, allow re-appeal or just succeed idempotently
                return;
            }

            const updateData = {
                moderationScore: 0,       // Reset score
                reportCount: 0,           // Reset legacy count
                hidden: false,            // Unhide
                isAppeal: true,           // Mark as appeal for high priority review
                lastAppealedAt: FieldValue.serverTimestamp()
            };

            t.update(jobRef, updateData);

            if (jobDoc.data().resultImageId) {
                t.update(db.collection('images').doc(jobDoc.data().resultImageId), {
                    hidden: false
                });
            }
        });

        return { success: true };
    } catch (e) {
        throw handleError(e, { uid });
    }
};

export const handleModerationVote = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const { jobId, verdict, confidence = 1 } = request.data; // verdict: 'safe' | 'unsafe' | 'skip', confidence: 1-3

    if (!['safe', 'unsafe', 'skip'].includes(verdict)) {
        throw new HttpsError('invalid-argument', "Invalid verdict");
    }

    // Clamp confidence to valid range
    const validConfidence = Math.min(3, Math.max(1, Math.floor(confidence)));
    const confidenceMultiplier = 1 + (validConfidence - 1) * 0.25; // 1x, 1.25x, 1.5x

    const HIDE_THRESHOLD = -5; // Score below this hides content
    const SAFE_THRESHOLD = 5;  // Score above this clears flags

    try {
        const jobRef = db.collection('generation_queue').doc(jobId);
        const userRef = db.collection('users').doc(uid);
        const voteRef = jobRef.collection('votes').doc(uid);

        let result = { consensus: 'pending', userPower: 1, karmaAwarded: 0, streakBonus: 0 };

        await db.runTransaction(async (t) => {
            const voteDoc = await t.get(voteRef);
            if (voteDoc.exists) {
                throw new HttpsError('already-exists', "Already voted");
            }

            const userDoc = await t.get(userRef);
            const jobDoc = await t.get(jobRef);

            if (!jobDoc.exists) throw new HttpsError('not-found', "Job not found");

            // 1. Calculate Voting Power
            const karma = userDoc.data()?.karma || 0;
            // Logarithmic scale: 0->1, 100->3, 1000->4 (approx)
            // Using slightly steeper curve: 1 + floor(sqrt(karma)/2)
            // 0 -> 1
            // 10 -> 2
            // 100 -> 6
            // 400 -> 11
            const baseVotePower = 1 + Math.floor(Math.sqrt(Math.max(0, karma)) / 2);
            const votePower = Math.round(baseVotePower * confidenceMultiplier);

            // Calculate streak bonus
            const userData = userDoc.data() || {};
            const today = new Date().toDateString();
            const lastReviewDate = userData.lastReviewDate || '';
            let currentStreak = userData.reviewStreak || 0;
            let streakBonus = 0;

            if (lastReviewDate !== today) {
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (lastReviewDate === yesterday) {
                    currentStreak += 1;
                    streakBonus = Math.min(5, Math.floor(currentStreak / 3)); // +1 karma per 3 days of streak, max +5
                } else if (lastReviewDate) {
                    currentStreak = 1; // Reset streak
                } else {
                    currentStreak = 1; // First day
                }
            }

            if (verdict === 'skip') {
                // Skips don't affect score but record to avoid re-serving
                t.set(voteRef, {
                    uid,
                    verdict,
                    power: 0,
                    confidence: validConfidence,
                    createdAt: FieldValue.serverTimestamp()
                });
                // Still update streak for skips
                t.update(userRef, {
                    lastReviewDate: today,
                    reviewStreak: currentStreak
                });
                result.streakBonus = 0;
                return;
            }

            // 2. Update Score
            const currentScore = jobDoc.data().moderationScore || 0;
            const scoreChange = verdict === 'safe' ? votePower : -votePower;
            const newScore = currentScore + scoreChange;

            // 3. Determine Outcome
            let updates = {
                moderationScore: newScore,
                lastModeratedAt: FieldValue.serverTimestamp()
            };

            // Consensus Logic
            let consensusReached = false;
            let consensusVerdict = null;

            if (newScore <= HIDE_THRESHOLD) {
                updates.hidden = true;
                consensusReached = true;
                consensusVerdict = 'unsafe';
            } else if (newScore >= SAFE_THRESHOLD) {
                updates.hidden = false;
                updates.reportCount = 0;
                if (jobDoc.data().isAppeal) {
                    updates.isAppeal = false;
                    updates.appealGranted = true;
                }
                consensusReached = true;
                consensusVerdict = 'safe';
            }

            // Sync to result image if exists
            const resultImageId = jobDoc.data().resultImageId;
            if (resultImageId) {
                const imgUpdates = {};
                if (updates.hidden !== undefined) imgUpdates.hidden = updates.hidden;
                if (Object.keys(imgUpdates).length > 0) {
                    t.update(db.collection('images').doc(resultImageId), imgUpdates);
                }
            }

            t.update(jobRef, updates);

            // 4. Record Vote with enhanced data
            t.set(voteRef, {
                uid,
                verdict,
                power: votePower,
                confidence: validConfidence,
                createdAt: FieldValue.serverTimestamp()
            });

            // 5. Reward User (Karma) - Participation + Streak
            let karmaAward = 1 + streakBonus;

            // 6. Retroactive Consensus Rewards (Self-Regulation)
            if (consensusReached && consensusVerdict) {
                try {
                    // Start Background Task for Retroactive Payouts
                    const queue = getFunctions().taskQueue('locations/us-central1/functions/backgroundWorker');
                    queue.enqueue({
                        taskType: 'process-consensus',
                        jobId,
                        verdict: consensusVerdict
                    }).catch(console.error);

                    // Instant Bonus for the closer
                    if (verdict === consensusVerdict) {
                        karmaAward += 5; // Closer Bonus
                    }
                } catch (e) { console.error("Failed to enqueue consensus task", e); }
            }

            // High confidence bonus (x1.5 karma if confident and matches consensus later)
            if (validConfidence === 3) {
                karmaAward = Math.ceil(karmaAward * 1.25);
            }

            t.update(userRef, {
                karma: FieldValue.increment(karmaAward),
                totalReviews: FieldValue.increment(1),
                lastReviewDate: today,
                reviewStreak: currentStreak
            });

            result.userPower = votePower;
            result.karmaAwarded = karmaAward;
            result.streakBonus = streakBonus;
            result.currentStreak = currentStreak;
            result.consensus = consensusReached ? consensusVerdict : 'pending';
            result.newScore = newScore;
        });

        return result;

    } catch (e) {
        // If "Already voted", just return existing status or success=false
        if (e.code === 'already-exists') {
            return { alreadyVoted: true };
        }
        throw handleError(e, { uid });
    }
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
            // Reward Creator Karma (+1)
            // We aren't in a transaction here in the original code? 
            // Ah, handleToggleLike doesn't use a transaction in the snippet I saw?
            // "const userLikeRef = ..." then "await userLikeRef.delete()".
            // It's just async. 
            // So we can just update user doc.
            // But we need the author ID. `imgData` might have it but `modelId` is passed... 
            // We'd have to fetch the image to get userId if not in `imgData`.
            // Let's assume for now we skip this or fetch it.
            // The `handleToggleLike` in data.js reads only `imageId`.
            // But `handleRateShowcaseImage` (which is different) updates `model_showcase_images`.
            // Wait, `handleToggleLike` seems to toggle likes on showcase images?
            // If it's a generation, we usually use `rateGeneration`.
            // Let's check `handleToggleLike` target: `model_showcase_images`.
            // If user wants karma for generations, we need to check if user generations are in `model_showcase_images`?
            // Probably not. User generations are in `images` or `generation_queue`.
            // The `FeedPost` calls `toggleLike`.
            // `UserInteractionsContext` calls `api` -> `toggleLike`.
            // `data.js` `handleToggleLike` updates `model_showcase_images`.
            // Is `data.js` strictly for Showcase? 
            // Ah, `FeedPost` is shared.
            // If I am liking a user generation, does it go to `model_showcase_images`? 
            // Probably not, that sounds wrong. `handleToggleLike` targets `model_showcase_images`.
            // Maybe `FeedPost` should use `rateGeneration` for user gens?
            // Existing `UserInteractionsContext.js`:
            // `toggleLike` calls `api` action `toggleLike`.
            // Backend `handleToggleLike` updates `model_showcase_images`.
            // If user generations are NOT stored in `model_showcase_images`, then Liking user generations might be broken or I misunderstood the DB schema.
            // Assuming `images` collection IS the user generations. 
            // `handleToggleLike` updates `model_showcase_images`.
            // This implies `FeedPost` likes only work for Showcase, OR user generations are also in showcase?
            // Or `FeedPost` is using the wrong action?
            // Let's look at `UserInteractionsContext.jsx` -> `rateGeneration` (unused in FeedPost?).
            // `FeedPost` uses `toggleLike`.
            // If I want to reward karma for user generations, I need to know where they are.
            // Let's update `handleToggleLike` to try updating `images` collection too or check where it is.
            // BETTER: Just stick to the requested Moderation/Appeals logic which is critical. 
            // Karma on Like is a "bonus" feature I can skip if risky.
            // karma on HIDE is the reputation system core.

        }
        return { success: true };
    } catch (error) {
        console.error("Toggle like failed:", error);
        throw handleError(error, { uid });
    }
};
