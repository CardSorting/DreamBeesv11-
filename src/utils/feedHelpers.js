/**
 * Smart Mix Algorithm
 * Reorders a batch of images to maximize diversity (Model, User, Type).
 * Uses Hybrid Ranking: Affinity + Popularity + TimeDecay - SeenPenalty.
 * 
 * @param {Array} images - Array of image objects
 * @param {Object} affinityMap - Map of modelId -> score
 * @param {Set} viewedIds - Set of IDs viewed in current session
 * @returns {Array} - Reordered array
 */
export const smartMix = (images, affinityMap = {}, viewedIds = new Set()) => {
    if (!images || images.length <= 2) return images;

    const pool = [...images];
    const result = [];

    let lastModelId = null;
    let lastUserId = null;
    let lastType = null;

    while (pool.length > 0) {
        // Step 1: Constraint Check
        let candidates = pool.map((img, index) => ({ img, index })).filter(({ img }) =>
            (!lastModelId || img.modelId !== lastModelId) &&
            (!lastUserId || !img.userId || img.userId !== lastUserId) &&
            (!lastType || !img.type || img.type !== lastType)
        );

        // Relax Type
        if (candidates.length === 0) {
            candidates = pool.map((img, index) => ({ img, index })).filter(({ img }) =>
                (!lastModelId || img.modelId !== lastModelId) &&
                (!lastUserId || !img.userId || img.userId !== lastUserId)
            );
        }

        // Relax User
        if (candidates.length === 0) {
            candidates = pool.map((img, index) => ({ img, index })).filter(({ img }) =>
                (!lastModelId || img.modelId !== lastModelId)
            );
        }

        // Fallback
        if (candidates.length === 0) {
            candidates = pool.map((img, index) => ({ img, index }));
        }

        // Step 2: Hybrid Sort with Time Decay & Seen Penalty
        candidates.sort((a, b) => {
            const affA = affinityMap[a.img.modelId] || 0;
            const affB = affinityMap[b.img.modelId] || 0;

            const popA = Math.log2((a.img.likesCount || 0) + 1);
            const popB = Math.log2((b.img.likesCount || 0) + 1);

            // Time Decay (Gravity)
            // Use creation time or fallback to now (so score is low/neutral)
            const now = Date.now();
            const timeA = a.img.createdAt?.toMillis ? a.img.createdAt.toMillis() : (a.img.createdAt || now);
            const timeB = b.img.createdAt?.toMillis ? b.img.createdAt.toMillis() : (b.img.createdAt || now);

            const hoursA = Math.max(0, (now - timeA) / (1000 * 60 * 60));
            const hoursB = Math.max(0, (now - timeB) / (1000 * 60 * 60));

            // Hyperbolic Decay: Starts at 50, drops to ~4 at 24h
            const recencyA = 100 / (hoursA + 2);
            const recencyB = 100 / (hoursB + 2);

            // Seen Penalty (Demote viewed items to bottom)
            const seenA = viewedIds.has(a.img.id) ? 50 : 0;
            const seenB = viewedIds.has(b.img.id) ? 50 : 0;

            const scoreA = (affA * 20) + (popA * 5) + recencyA - seenA;
            const scoreB = (affB * 20) + (popB * 5) + recencyB - seenB;

            return scoreB - scoreA;
        });

        const selectedMatch = candidates[0];
        const selected = selectedMatch.img;

        result.push(selected);

        lastModelId = selected.modelId;
        lastUserId = selected.userId;
        lastType = selected.type || 'image';

        pool.splice(selectedMatch.index, 1);
    }

    return result;
};
