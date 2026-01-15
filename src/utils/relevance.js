/**
 * DreamBees Relevance Engine v3.0 - "Neural Compass"
 * 
 * A multi-dimensional similarity scoring system that creates
 * intelligent, contextual image recommendations.
 * 
 * SCORING PHILOSOPHY:
 * 1. Context-Aware Weighting: Scores adapt based on what metadata is available
 * 2. Semantic Clustering: Groups similar concepts even if tags differ
 * 3. Vibe Resonance: Emotional/atmospheric matching for better "feel" alignment
 * 4. Diversity Injection: Prevents style loops while maintaining relevance
 * 5. Freshness Factor: Time-decay and recency signals
 */

// ============================================================================
// CONFIGURATION - Tunable scoring weights
// ============================================================================
const WEIGHTS = {
    // Primary Signals (High Impact)
    SUBJECT_CATEGORY: 8,      // Core content type match
    SUBJECT_DETAILS_OVERLAP: 6, // Partial subject description match
    STYLE_PRIMARY: 6,         // Main artistic style (Anime, Realistic, etc)
    STYLE_SUBGENRE: 5,        // Specific niche (Cyberpunk, Cottagecore)
    STYLE_TECHNIQUE: 3,       // Technique match (Digital Painting, etc)

    // Style Intelligence
    STYLE_TOKEN_MATCH: 4,     // Internal similarity anchors

    // Visual Cohesion
    PALETTE_EXACT: 5,         // Exact color palette name match
    PALETTE_SIMILARITY: 3,    // Similar palette vibes
    COMPOSITION_SHOT: 3,      // Shot type match
    COMPOSITION_VIEW: 2,      // View angle match

    // Emotional Layer
    VIBE_MOOD: 4,             // Mood atmosphere match
    VIBE_TAG: 2,              // Per vibe tag match

    // Content Signals
    ATOMIC_TAG: 1.5,          // Per atomic tag match (raised from 1)
    ML_TRIGGER_WORD: 1.5,     // Technical style token match

    // Curator Signals
    COLLECTION_MATCH: 3,      // Suggested collection overlap
    SUITABILITY_MATCH: 2,     // Usage type match
    QUALITY_TIER_MATCH: 2,    // Similar quality tier

    // Search/Discovery
    SEARCH_QUERY_OVERLAP: 1,  // Similar discovery queries

    // Prompt Analysis
    PROMPT_WORD_MATCH: 0.3,   // Per significant word match
    PROMPT_PHRASE_MATCH: 2,   // Multi-word phrase match

    // Engine/Model
    MODEL_MATCH: 3,           // Same generation model

    // Diversity Signals
    RANDOM_JITTER: 1.5,       // Controlled chaos for variety
    FRESHNESS_BOOST: 2,       // Recency bonus (if timestamps available)
};

// Semantic clusters for intelligent grouping
const SEMANTIC_CLUSTERS = {
    moods: {
        positive: ['happy', 'joyful', 'cheerful', 'upbeat', 'bright', 'optimistic', 'playful', 'fun'],
        serene: ['calm', 'peaceful', 'tranquil', 'relaxing', 'soothing', 'zen', 'meditative'],
        dark: ['moody', 'dark', 'mysterious', 'gothic', 'noir', 'ominous', 'brooding'],
        energetic: ['dynamic', 'energetic', 'intense', 'powerful', 'action', 'dramatic', 'epic'],
        dreamy: ['ethereal', 'dreamy', 'surreal', 'fantasy', 'magical', 'whimsical', 'mystical'],
        romantic: ['romantic', 'intimate', 'sensual', 'warm', 'cozy', 'nostalgic', 'soft'],
        futuristic: ['cyberpunk', 'sci-fi', 'futuristic', 'neon', 'tech', 'digital', 'glitch']
    },
    subjects: {
        character: ['portrait', 'character', 'person', 'figure', 'face', 'avatar', 'model'],
        landscape: ['landscape', 'scenery', 'environment', 'nature', 'outdoor', 'vista'],
        abstract: ['abstract', 'geometric', 'pattern', 'texture', 'minimal', 'conceptual'],
        creature: ['creature', 'monster', 'animal', 'beast', 'dragon', 'fantasy creature'],
        architecture: ['building', 'architecture', 'interior', 'city', 'urban', 'structure']
    },
    styles: {
        anime: ['anime', 'manga', 'japanese', 'cel-shaded', 'chibi', '2d'],
        realistic: ['realistic', 'photorealistic', 'hyperrealistic', '3d render', 'photo'],
        painterly: ['oil painting', 'watercolor', 'impressionist', 'classical', 'traditional'],
        digital: ['digital art', 'cg', 'render', 'concept art', 'illustration']
    }
};

// Stop words for prompt analysis
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'of', 'in', 'on', 'with', 'by', 'and', 'or', 'to', 'from',
    'at', 'is', 'as', 'for', 'be', 'are', 'was', 'were', 'been', 'being',
    'width', 'height', 'style', 'view', 'image', 'photo', 'picture',
    'high', 'quality', 'best', 'detailed', 'masterpiece', 'beautiful',
    ',', '.', ':', ';', '!', '?', '-', '_', '(', ')', '[', ']', '{', '}'
]);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Tokenizes and cleans text for comparison
 */
function tokenize(text) {
    if (!text || typeof text !== 'string') return new Set();
    return new Set(
        text.toLowerCase()
            .split(/[\s,.\-_:;!?()\[\]{}]+/)
            .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    );
}

/**
 * Calculates Jaccard similarity between two sets
 */
function jaccardSimilarity(setA, setB) {
    if (!setA.size || !setB.size) return 0;
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

/**
 * Finds overlapping items between two arrays
 */
function arrayOverlap(arr1, arr2) {
    if (!arr1 || !arr2) return 0;
    const set1 = new Set(arr1.map(x => x.toLowerCase()));
    return arr2.filter(x => set1.has(x.toLowerCase())).length;
}

/**
 * Check if two values are in the same semantic cluster
 */
function inSameCluster(clusterMap, val1, val2) {
    if (!val1 || !val2) return false;
    const v1 = val1.toLowerCase();
    const v2 = val2.toLowerCase();

    for (const clusterValues of Object.values(clusterMap)) {
        const hasV1 = clusterValues.some(c => v1.includes(c) || c.includes(v1));
        const hasV2 = clusterValues.some(c => v2.includes(c) || c.includes(v2));
        if (hasV1 && hasV2) return true;
    }
    return false;
}

/**
 * Extract multi-word phrases from text
 */
function extractPhrases(text, minWords = 2, maxWords = 4) {
    if (!text) return [];
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const phrases = [];

    for (let size = minWords; size <= Math.min(maxWords, words.length); size++) {
        for (let i = 0; i <= words.length - size; i++) {
            phrases.push(words.slice(i, i + size).join(' '));
        }
    }
    return phrases;
}

/**
 * Calculate time-based freshness score
 */
function freshnessScore(candidateDate, maxBoost = 2) {
    if (!candidateDate) return 0;

    const now = Date.now();
    const candidateTime = candidateDate?.toDate ? candidateDate.toDate().getTime() :
        candidateDate instanceof Date ? candidateDate.getTime() :
            new Date(candidateDate).getTime();

    if (isNaN(candidateTime)) return 0;

    const daysSince = (now - candidateTime) / (1000 * 60 * 60 * 24);

    // Decay curve: Full boost for <7 days, half at 30 days, minimal after 90
    if (daysSince < 7) return maxBoost;
    if (daysSince < 30) return maxBoost * 0.6;
    if (daysSince < 90) return maxBoost * 0.3;
    return 0;
}

// ============================================================================
// MAIN SCORING ENGINE
// ============================================================================

/**
 * Calculates comprehensive relevance score between source and candidate
 * @param {Object} source - The source image to find matches for
 * @param {Object} candidate - A candidate image to score
 * @returns {number} - The relevance score
 */
function scoreCandidate(source, candidate) {
    let score = 0;
    let signals = []; // For debugging/transparency

    // 1. SUBJECT MATCHING (What is the image about?)
    // -----------------------------------------------
    if (source.subject && candidate.subject) {
        // Category match (Character, Landscape, etc)
        if (source.subject.category && candidate.subject.category) {
            if (source.subject.category.toLowerCase() === candidate.subject.category.toLowerCase()) {
                score += WEIGHTS.SUBJECT_CATEGORY;
                signals.push('subjectCategory');
            } else if (inSameCluster(SEMANTIC_CLUSTERS.subjects, source.subject.category, candidate.subject.category)) {
                score += WEIGHTS.SUBJECT_CATEGORY * 0.5;
                signals.push('subjectCluster');
            }
        }

        // Subject details overlap (tokenized comparison)
        if (source.subject.details && candidate.subject.details) {
            const srcTokens = tokenize(source.subject.details);
            const candTokens = tokenize(candidate.subject.details);
            const similarity = jaccardSimilarity(srcTokens, candTokens);
            score += similarity * WEIGHTS.SUBJECT_DETAILS_OVERLAP;
            if (similarity > 0.2) signals.push('subjectDetails');
        }
    }

    // 2. STYLE MATCHING (How does it look?)
    // -----------------------------------------------
    if (source.style && candidate.style) {
        // Primary style (Anime, Realistic, etc)
        if (source.style.primary && candidate.style.primary) {
            if (source.style.primary.toLowerCase() === candidate.style.primary.toLowerCase()) {
                score += WEIGHTS.STYLE_PRIMARY;
                signals.push('stylePrimary');
            } else if (inSameCluster(SEMANTIC_CLUSTERS.styles, source.style.primary, candidate.style.primary)) {
                score += WEIGHTS.STYLE_PRIMARY * 0.4;
                signals.push('styleCluster');
            }
        }

        // Sub-genre (Cyberpunk, Cottagecore, etc)
        if (source.style.subGenre && candidate.style.subGenre) {
            if (source.style.subGenre.toLowerCase() === candidate.style.subGenre.toLowerCase()) {
                score += WEIGHTS.STYLE_SUBGENRE;
                signals.push('styleSubGenre');
            }
        }

        // Technique match
        if (source.style.technique && candidate.style.technique) {
            if (source.style.technique.toLowerCase() === candidate.style.technique.toLowerCase()) {
                score += WEIGHTS.STYLE_TECHNIQUE;
                signals.push('styleTechnique');
            }
        }
    }

    // 3. STYLE TOKENS (Internal similarity anchors)
    // -----------------------------------------------
    if (source.styleTokens?.length && candidate.styleTokens?.length) {
        const overlap = arrayOverlap(source.styleTokens, candidate.styleTokens);
        score += overlap * WEIGHTS.STYLE_TOKEN_MATCH;
        if (overlap > 0) signals.push(`styleTokens:${overlap}`);
    }

    // 4. VISUAL COMPOSITION
    // -----------------------------------------------
    if (source.composition && candidate.composition) {
        if (source.composition.shotType && candidate.composition.shotType &&
            source.composition.shotType.toLowerCase() === candidate.composition.shotType.toLowerCase()) {
            score += WEIGHTS.COMPOSITION_SHOT;
            signals.push('compositionShot');
        }

        if (source.composition.view && candidate.composition.view &&
            source.composition.view.toLowerCase() === candidate.composition.view.toLowerCase()) {
            score += WEIGHTS.COMPOSITION_VIEW;
            signals.push('compositionView');
        }
    }

    // 5. COLOR COHESION
    // -----------------------------------------------
    if (source.colors && candidate.colors) {
        // Palette name match
        if (source.colors.paletteName && candidate.colors.paletteName) {
            const srcPalette = source.colors.paletteName.toLowerCase();
            const candPalette = candidate.colors.paletteName.toLowerCase();

            if (srcPalette === candPalette) {
                score += WEIGHTS.PALETTE_EXACT;
                signals.push('paletteExact');
            } else {
                // Check for partial match (e.g., "Neon Cyber" vs "Neon Pop")
                const srcWords = tokenize(srcPalette);
                const candWords = tokenize(candPalette);
                if (jaccardSimilarity(srcWords, candWords) > 0.3) {
                    score += WEIGHTS.PALETTE_SIMILARITY;
                    signals.push('paletteSimilar');
                }
            }
        }
    }

    // 6. VIBE/MOOD RESONANCE (Emotional layer)
    // -----------------------------------------------
    if (source.vibe && candidate.vibe) {
        // Mood match
        if (source.vibe.mood && candidate.vibe.mood) {
            const srcMood = source.vibe.mood.toLowerCase();
            const candMood = candidate.vibe.mood.toLowerCase();

            if (srcMood === candMood) {
                score += WEIGHTS.VIBE_MOOD;
                signals.push('vibeMood');
            } else if (inSameCluster(SEMANTIC_CLUSTERS.moods, srcMood, candMood)) {
                score += WEIGHTS.VIBE_MOOD * 0.6;
                signals.push('vibeMoodCluster');
            }
        }

        // Vibe tags overlap
        if (source.vibe.tags?.length && candidate.vibe.tags?.length) {
            const overlap = arrayOverlap(source.vibe.tags, candidate.vibe.tags);
            score += overlap * WEIGHTS.VIBE_TAG;
            if (overlap > 0) signals.push(`vibeTags:${overlap}`);
        }
    }

    // Legacy: discovery.vibeTags fallback
    if (source.discovery?.vibeTags && candidate.discovery?.vibeTags) {
        const overlap = arrayOverlap(source.discovery.vibeTags, candidate.discovery.vibeTags);
        score += overlap * WEIGHTS.VIBE_TAG;
        if (overlap > 0) signals.push(`legacyVibeTags:${overlap}`);
    }

    // 7. ATOMIC TAGS (Literal content)
    // -----------------------------------------------
    if (source.tags?.length && candidate.tags?.length) {
        const overlap = arrayOverlap(source.tags, candidate.tags);
        score += overlap * WEIGHTS.ATOMIC_TAG;
        if (overlap > 0) signals.push(`atomicTags:${overlap}`);
    }

    // 8. ML TRIGGER WORDS (Technical tokens)
    // -----------------------------------------------
    if (source.mlTraining?.triggerWords?.length && candidate.mlTraining?.triggerWords?.length) {
        const overlap = arrayOverlap(source.mlTraining.triggerWords, candidate.mlTraining.triggerWords);
        score += overlap * WEIGHTS.ML_TRIGGER_WORD;
        if (overlap > 0) signals.push(`triggerWords:${overlap}`);
    }

    // 9. CURATION SIGNALS
    // -----------------------------------------------
    if (source.curation && candidate.curation) {
        // Collection overlap
        if (source.curation.suggestedCollections?.length && candidate.curation.suggestedCollections?.length) {
            const overlap = arrayOverlap(source.curation.suggestedCollections, candidate.curation.suggestedCollections);
            score += overlap * WEIGHTS.COLLECTION_MATCH;
            if (overlap > 0) signals.push(`collections:${overlap}`);
        }

        // Quality tier matching (group similar quality levels)
        if (source.curation.score && candidate.curation.score) {
            const srcTier = Math.floor(source.curation.score / 3); // 1-3, 4-6, 7-10
            const candTier = Math.floor(candidate.curation.score / 3);
            if (srcTier === candTier) {
                score += WEIGHTS.QUALITY_TIER_MATCH;
                signals.push('qualityTier');
            }
        }
    }

    // 10. SUITABILITY MATCHING
    // -----------------------------------------------
    if (source.suitability?.length && candidate.suitability?.length) {
        const overlap = arrayOverlap(source.suitability, candidate.suitability);
        score += overlap * WEIGHTS.SUITABILITY_MATCH;
        if (overlap > 0) signals.push(`suitability:${overlap}`);
    }

    // 11. DISCOVERY/SEARCH QUERIES
    // -----------------------------------------------
    if (source.discovery?.searchQueries?.length && candidate.discovery?.searchQueries?.length) {
        // Tokenize all search queries and find overlap
        const srcQueries = new Set(source.discovery.searchQueries.flatMap(q => tokenize(q)));
        const candQueries = new Set(candidate.discovery.searchQueries.flatMap(q => tokenize(q)));
        const similarity = jaccardSimilarity(srcQueries, candQueries);
        score += similarity * WEIGHTS.SEARCH_QUERY_OVERLAP * 5; // Multiply by query count
        if (similarity > 0.1) signals.push('searchQueries');
    }

    // 12. PROMPT ANALYSIS (Semantic text similarity)
    // -----------------------------------------------
    if (source.prompt && candidate.prompt) {
        // Word-level overlap
        const srcTokens = tokenize(source.prompt);
        const candTokens = tokenize(candidate.prompt);
        const wordOverlap = [...srcTokens].filter(t => candTokens.has(t)).length;
        score += wordOverlap * WEIGHTS.PROMPT_WORD_MATCH;
        if (wordOverlap > 3) signals.push(`promptWords:${wordOverlap}`);

        // Phrase-level matching (more meaningful)
        const srcPhrases = extractPhrases(source.prompt)
            .filter(p => !STOP_WORDS.has(p.split(' ')[0]));
        const candPromptLower = candidate.prompt.toLowerCase();

        let phraseMatches = 0;
        for (const phrase of srcPhrases) {
            if (candPromptLower.includes(phrase)) {
                phraseMatches++;
            }
        }
        score += phraseMatches * WEIGHTS.PROMPT_PHRASE_MATCH;
        if (phraseMatches > 0) signals.push(`promptPhrases:${phraseMatches}`);
    }

    // 13. MODEL/ENGINE MATCH
    // -----------------------------------------------
    if (source.modelId && candidate.modelId && source.modelId === candidate.modelId) {
        score += WEIGHTS.MODEL_MATCH;
        signals.push('modelMatch');
    }

    // 14. FRESHNESS BOOST (Recency signal)
    // -----------------------------------------------
    const fresh = freshnessScore(candidate.createdAt, WEIGHTS.FRESHNESS_BOOST);
    score += fresh;
    if (fresh > 0) signals.push(`freshness:${fresh.toFixed(1)}`);

    // 15. CONTROLLED RANDOMNESS (Break ties, add variety)
    // -----------------------------------------------
    score += Math.random() * WEIGHTS.RANDOM_JITTER;

    return { score, signals };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Main relevance calculation function.
 * Calculates relevance score between a source image and candidate images.
 * Returns sorted list of related images.
 * 
 * @param {Object} source - The source image to find matches for
 * @param {Array} candidates - Array of candidate images to score
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} - Sorted array of relevant images
 */
export function calculateRelevance(source, candidates, limit = 12) {
    if (!source || !candidates || candidates.length === 0) return [];

    const scored = candidates
        .filter(c => c.id !== source.id) // Exclude self
        .map(candidate => {
            const { score, signals } = scoreCandidate(source, candidate);
            return { item: candidate, score, signals };
        });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Debug: Log top 3 matches with their signals
    // console.log('[Relevance] Top matches:', scored.slice(0, 3).map(s => ({
    //     id: s.item.id?.slice(0, 8),
    //     score: s.score.toFixed(1),
    //     signals: s.signals.slice(0, 5)
    // })));

    // Return top N items
    return scored.slice(0, limit).map(s => s.item);
}

/**
 * Gets a diversified list of recommendations.
 * Mixes high-relevance items with discovery items to prevent style loops.
 * Uses stratified sampling for better variety.
 * 
 * @param {Object} source - The source image
 * @param {Array} candidates - Array of candidate images
 * @param {number} limit - Maximum number of results
 * @returns {Array} - Diversified array of recommended images
 */
export function getDiversifiedRecommendations(source, candidates, limit = 10) {
    if (!source || !candidates || candidates.length === 0) return [];

    // 1. Score all candidates
    const scored = candidates
        .filter(c => c.id !== source.id)
        .map(candidate => {
            const { score } = scoreCandidate(source, candidate);
            return { item: candidate, score };
        })
        .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return [];

    // 2. Stratified sampling: High (50%), Medium (30%), Random (20%)
    const highCount = Math.floor(limit * 0.5);
    const mediumCount = Math.floor(limit * 0.3);
    const randomCount = limit - highCount - mediumCount;

    // High relevance: Top scores
    const highRelevance = scored.slice(0, highCount);

    // Medium relevance: Middle tier
    const midStart = highCount;
    const midEnd = Math.min(scored.length, highCount + Math.floor(scored.length * 0.4));
    const mediumPool = scored.slice(midStart, midEnd);
    const shuffledMedium = [...mediumPool].sort(() => Math.random() - 0.5);
    const mediumRelevance = shuffledMedium.slice(0, mediumCount);

    // Random discovery: From the rest (excluding already selected)
    const selectedIds = new Set([
        ...highRelevance.map(s => s.item.id),
        ...mediumRelevance.map(s => s.item.id)
    ]);
    const remainingPool = scored.filter(s => !selectedIds.has(s.item.id));
    const shuffledRemaining = [...remainingPool].sort(() => Math.random() - 0.5);
    const randomPicks = shuffledRemaining.slice(0, randomCount);

    // 3. Combine and shuffle final order
    const combined = [...highRelevance, ...mediumRelevance, ...randomPicks];
    const result = [...combined].sort(() => Math.random() - 0.5);

    return result.map(s => s.item);
}

/**
 * Gets recommendations with explicit diversity controls.
 * Useful for "More Like This" that shouldn't be TOO similar.
 * 
 * @param {Object} source - The source image
 * @param {Array} candidates - Array of candidate images
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of recommended images with diversity
 */
export function getBalancedRecommendations(source, candidates, options = {}) {
    const {
        limit = 12,
        maxSameModel = 3,      // Max images from same model
        maxSameStyle = 4,      // Max images with same primary style
        minDiversity = 0.3    // Minimum diversity score (0-1)
    } = options;

    if (!source || !candidates || candidates.length === 0) return [];

    const scored = candidates
        .filter(c => c.id !== source.id)
        .map(candidate => {
            const { score } = scoreCandidate(source, candidate);
            return { item: candidate, score };
        })
        .sort((a, b) => b.score - a.score);

    const selected = [];
    const modelCounts = {};
    const styleCounts = {};

    for (const { item } of scored) {
        if (selected.length >= limit) break;

        // Check model diversity
        const modelId = item.modelId || 'unknown';
        if ((modelCounts[modelId] || 0) >= maxSameModel) continue;

        // Check style diversity
        const style = item.style?.primary?.toLowerCase() || 'unknown';
        if ((styleCounts[style] || 0) >= maxSameStyle) continue;

        // Add to selection
        selected.push(item);
        modelCounts[modelId] = (modelCounts[modelId] || 0) + 1;
        styleCounts[style] = (styleCounts[style] || 0) + 1;
    }

    // If we couldn't fill the limit due to diversity constraints, add more
    if (selected.length < limit) {
        const selectedIds = new Set(selected.map(s => s.id));
        const remaining = scored
            .filter(s => !selectedIds.has(s.item.id))
            .slice(0, limit - selected.length);
        selected.push(...remaining.map(s => s.item));
    }

    return selected;
}

/**
 * Finds images that share specific attributes.
 * Good for "More in this style" or "Similar colors" features.
 * 
 * @param {Object} source - The source image
 * @param {Array} candidates - Array of candidate images  
 * @param {string} attribute - Attribute to match ('style', 'mood', 'color', 'subject')
 * @param {number} limit - Maximum results
 * @returns {Array} - Images matching the specified attribute
 */
export function findByAttribute(source, candidates, attribute = 'style', limit = 8) {
    if (!source || !candidates || candidates.length === 0) return [];

    const matchers = {
        style: (src, cand) => {
            if (!src.style?.primary || !cand.style?.primary) return 0;
            let score = 0;
            if (src.style.primary.toLowerCase() === cand.style.primary.toLowerCase()) score += 10;
            if (src.style.subGenre?.toLowerCase() === cand.style.subGenre?.toLowerCase()) score += 5;
            return score;
        },
        mood: (src, cand) => {
            if (!src.vibe?.mood || !cand.vibe?.mood) return 0;
            if (src.vibe.mood.toLowerCase() === cand.vibe.mood.toLowerCase()) return 10;
            if (inSameCluster(SEMANTIC_CLUSTERS.moods, src.vibe.mood, cand.vibe.mood)) return 6;
            return 0;
        },
        color: (src, cand) => {
            if (!src.colors?.paletteName || !cand.colors?.paletteName) return 0;
            if (src.colors.paletteName.toLowerCase() === cand.colors.paletteName.toLowerCase()) return 10;
            return 0;
        },
        subject: (src, cand) => {
            if (!src.subject?.category || !cand.subject?.category) return 0;
            if (src.subject.category.toLowerCase() === cand.subject.category.toLowerCase()) return 10;
            return 0;
        }
    };

    const matcher = matchers[attribute] || matchers.style;

    const scored = candidates
        .filter(c => c.id !== source.id)
        .map(candidate => ({
            item: candidate,
            score: matcher(source, candidate) + Math.random() * 0.5
        }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => s.item);
}
