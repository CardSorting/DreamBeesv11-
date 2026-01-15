/**
 * Calculates relevance score between a source image and candidate images.
 * Returns sorted list of related images.
 * 
 * Scoring Weights:
 * - Model Match: 10 points (High weight for similar aesthetic engine)
 * - Vibe Tag Match: 3 points each
 * - Style Match (Primary): 5 points
 * - Style Match (SubGenre): 5 points
 * - Color Palette Match: 5 points
 * - Atomic Tag Match: 1 point each
 */
export function calculateRelevance(source, candidates, limit = 12) {
    if (!source || !candidates || candidates.length === 0) return [];

    const scored = candidates
        .filter(c => c.id !== source.id) // Exclude self
        .map(candidate => {
            let score = 0;

            // 1. Model Match (Strong signal for same engine aesthetics)
            if (candidate.modelId === source.modelId) {
                score += 10;
            }

            // 2. Style Match
            if (source.style && candidate.style) {
                if (source.style.primary === candidate.style.primary) score += 5;
                if (source.style.subGenre === candidate.style.subGenre) score += 5;
            }

            // 3. Vibe Tags (Emotional resonance)
            if (source.discovery?.vibeTags && candidate.discovery?.vibeTags) {
                source.discovery.vibeTags.forEach(tag => {
                    if (candidate.discovery.vibeTags.includes(tag)) {
                        score += 3;
                    }
                });
            }

            // 4. Color Palette (Visual cohesion)
            if (source.colors?.paletteName && candidate.colors?.paletteName) {
                if (source.colors.paletteName === candidate.colors.paletteName) {
                    score += 5;
                }
            }

            // 5. Atomic Tags (Literal content)
            if (source.tags && candidate.tags) {
                source.tags.forEach(tag => {
                    if (candidate.tags.includes(tag)) {
                        score += 1;
                    }
                });
            }

            return { item: candidate, score };
        });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return top N items
    return scored.slice(0, limit).map(s => s.item);
}
/**
 * Gets a diversified list of recommendations.
 * Mixes high-relevance items with some random "discovery" items to prevent style loops.
 */
export function getDiversifiedRecommendations(source, candidates, limit = 10) {
    if (!source || !candidates || candidates.length === 0) return [];

    // 1. Get all scored items
    const relevant = calculateRelevance(source, candidates, candidates.length);

    // 2. Take top 70% from relevance, 30% random
    const topCount = Math.floor(limit * 0.7);
    const randomCount = limit - topCount;

    const selections = relevant.slice(0, topCount);
    const remaining = relevant.slice(topCount);

    // 3. Shuffle remaining and pick random
    const shuffled = [...remaining].sort(() => 0.5 - Math.random());
    const randomPicks = shuffled.slice(0, randomCount);

    return [...selections, ...randomPicks].sort(() => 0.5 - Math.random());
}
