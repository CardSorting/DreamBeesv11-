/**
 * DreamBees Relevance Engine v4.0 - "Prismatic Discovery"
 * 
 * An advanced multi-dimensional recommendation engine with heavy emphasis
 * on DIVERSITY and DISCOVERY while maintaining contextual relevance.
 * 
 * KEY DIVERSITY FEATURES:
 * 1. Multi-Axis Diversity: Enforces variety across style, mood, color, subject, model
 * 2. Anti-Clustering: Prevents over-representation of any single attribute
 * 3. Exploration Slots: Reserved positions for wildcard discoveries
 * 4. Diminishing Returns: Reduces score for attributes already well-represented
 * 5. History Awareness: Can exclude recently seen items
 * 6. Cluster Rotation: Samples from different semantic clusters in rotation
 */

// ============================================================================
// CONFIGURATION - Tunable weights and diversity controls
// ============================================================================
const WEIGHTS = {
    // Primary Signals (High Impact)
    SUBJECT_GENDER: 15,
    SUBJECT_CATEGORY: 8,
    SUBJECT_DETAILS_OVERLAP: 6,
    STYLE_PRIMARY: 6,
    STYLE_SUBGENRE: 5,
    STYLE_TECHNIQUE: 3,

    // Style Intelligence
    STYLE_TOKEN_MATCH: 4,

    // Visual Cohesion
    PALETTE_EXACT: 5,
    PALETTE_SIMILARITY: 3,
    COMPOSITION_SHOT: 3,
    COMPOSITION_VIEW: 2,

    // Emotional Layer
    VIBE_MOOD: 4,
    VIBE_TAG: 2,

    // Content Signals
    ATOMIC_TAG: 1.5,
    ML_TRIGGER_WORD: 1.5,

    // Curator Signals
    COLLECTION_MATCH: 3,
    SUITABILITY_MATCH: 2,
    QUALITY_TIER_MATCH: 2,

    // Search/Discovery
    SEARCH_QUERY_OVERLAP: 1,

    // Prompt Analysis
    PROMPT_WORD_MATCH: 0.3,
    PROMPT_PHRASE_MATCH: 2,

    // Engine/Model
    MODEL_MATCH: 3,

    // Diversity & Exploration
    RANDOM_JITTER: 2.5,       // Increased randomness
    FRESHNESS_BOOST: 2,
    DIVERSITY_BONUS: 3,       // Bonus for unique attributes
};

// Diversity enforcement limits
const DIVERSITY_LIMITS = {
    maxSameModel: 2,          // Max 2 images from same model
    maxSamePrimaryStyle: 3,   // Max 3 images with same primary style
    maxSameSubGenre: 2,       // Max 2 with same sub-genre
    maxSameMood: 3,           // Max 3 with same mood
    maxSamePalette: 2,        // Max 2 with same color palette
    maxSameSubjectCategory: 3, // Max 3 with same subject type
    explorationRatio: 0.25,   // 25% slots reserved for exploration
};

// Semantic clusters for intelligent grouping
export const SEMANTIC_CLUSTERS = {
    moods: {
        positive: ['happy', 'joyful', 'cheerful', 'upbeat', 'bright', 'optimistic', 'playful', 'fun', 'vibrant'],
        serene: ['calm', 'peaceful', 'tranquil', 'relaxing', 'soothing', 'zen', 'meditative', 'gentle', 'soft'],
        dark: ['moody', 'dark', 'mysterious', 'gothic', 'noir', 'ominous', 'brooding', 'sinister', 'shadowy'],
        energetic: ['dynamic', 'energetic', 'intense', 'powerful', 'action', 'dramatic', 'epic', 'explosive'],
        dreamy: ['ethereal', 'dreamy', 'surreal', 'fantasy', 'magical', 'whimsical', 'mystical', 'otherworldly'],
        romantic: ['romantic', 'intimate', 'sensual', 'warm', 'cozy', 'nostalgic', 'soft', 'tender'],
        futuristic: ['cyberpunk', 'sci-fi', 'futuristic', 'neon', 'tech', 'digital', 'glitch', 'holographic'],
        nature: ['natural', 'organic', 'earthy', 'wild', 'fresh', 'botanical', 'forest', 'oceanic']
    },
    subjects: {
        character: ['portrait', 'character', 'person', 'figure', 'face', 'avatar', 'model', 'human'],
        landscape: ['landscape', 'scenery', 'environment', 'nature', 'outdoor', 'vista', 'panorama'],
        abstract: ['abstract', 'geometric', 'pattern', 'texture', 'minimal', 'conceptual', 'non-representational'],
        creature: ['creature', 'monster', 'animal', 'beast', 'dragon', 'fantasy creature', 'mythical'],
        architecture: ['building', 'architecture', 'interior', 'city', 'urban', 'structure', 'room'],
        object: ['still life', 'object', 'item', 'product', 'food', 'vehicle', 'weapon']
    },
    styles: {
        anime: ['anime', 'manga', 'japanese', 'cel-shaded', 'chibi', '2d', 'cartoon'],
        realistic: ['realistic', 'photorealistic', 'hyperrealistic', '3d render', 'photo', 'lifelike'],
        painterly: ['oil painting', 'watercolor', 'impressionist', 'classical', 'traditional', 'acrylic'],
        digital: ['digital art', 'cg', 'render', 'concept art', 'illustration', 'vector'],
        stylized: ['stylized', 'low poly', 'pixel art', 'voxel', 'flat', 'graphic']
    },
    palettes: {
        warm: ['warm', 'sunset', 'golden', 'autumn', 'fire', 'orange', 'red', 'cozy'],
        cool: ['cool', 'cold', 'winter', 'ocean', 'ice', 'blue', 'arctic', 'frost'],
        neon: ['neon', 'cyber', 'synthwave', 'retrowave', 'glowing', 'electric', 'vivid'],
        pastel: ['pastel', 'soft', 'muted', 'gentle', 'candy', 'spring', 'light'],
        dark: ['dark', 'moody', 'noir', 'shadow', 'night', 'gothic', 'black'],
        natural: ['natural', 'earthy', 'forest', 'botanical', 'green', 'organic']
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

function tokenize(text) {
    if (!text || typeof text !== 'string') return new Set();
    return new Set(
        text.toLowerCase()
            .split(/[\s,.\-_:;!?()\[\]{}]+/)
            .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    );
}

function jaccardSimilarity(setA, setB) {
    if (!setA.size || !setB.size) return 0;
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

function arrayOverlap(arr1, arr2) {
    if (!arr1 || !arr2) return 0;
    const set1 = new Set(arr1.map(x => x.toLowerCase()));
    return arr2.filter(x => set1.has(x.toLowerCase())).length;
}

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

export function getClusterName(clusterMap, value) {
    if (!value) return null;
    const v = value.toLowerCase();

    for (const [clusterName, clusterValues] of Object.entries(clusterMap)) {
        if (clusterValues.some(c => v.includes(c) || c.includes(v))) {
            return clusterName;
        }
    }
    return null;
}

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

function freshnessScore(candidateDate, maxBoost = 2) {
    if (!candidateDate) return 0;

    const now = Date.now();
    const candidateTime = candidateDate?.toDate ? candidateDate.toDate().getTime() :
        candidateDate instanceof Date ? candidateDate.getTime() :
            new Date(candidateDate).getTime();

    if (isNaN(candidateTime)) return 0;

    const daysSince = (now - candidateTime) / (1000 * 60 * 60 * 24);

    if (daysSince < 7) return maxBoost;
    if (daysSince < 30) return maxBoost * 0.6;
    if (daysSince < 90) return maxBoost * 0.3;
    return 0;
}

/**
 * Fisher-Yates shuffle for true randomization
 */
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Extract diversity fingerprint from an image
 */
function getDiversityFingerprint(item) {
    return {
        modelId: item.modelId || 'unknown',
        primaryStyle: item.style?.primary?.toLowerCase() || 'unknown',
        subGenre: item.style?.subGenre?.toLowerCase() || 'unknown',
        mood: item.vibe?.mood?.toLowerCase() || 'unknown',
        moodCluster: getClusterName(SEMANTIC_CLUSTERS.moods, item.vibe?.mood) || 'unknown',
        palette: item.colors?.paletteName?.toLowerCase() || 'unknown',
        paletteCluster: getClusterName(SEMANTIC_CLUSTERS.palettes, item.colors?.paletteName) || 'unknown',
        subjectCategory: item.subject?.category?.toLowerCase() || 'unknown',
        subjectCluster: getClusterName(SEMANTIC_CLUSTERS.subjects, item.subject?.category) || 'unknown',
        styleCluster: getClusterName(SEMANTIC_CLUSTERS.styles, item.style?.primary) || 'unknown',
    };
}

// ============================================================================
// SCORING ENGINE
// ============================================================================

function scoreCandidate(source, candidate) {
    let score = 0;
    let signals = [];

    // 1. SUBJECT MATCHING
    if (source.subject && candidate.subject) {
        // Gender matching (Critical for character consistency)
        if (source.subject.gender && candidate.subject.gender) {
            if (source.subject.gender.toLowerCase() === candidate.subject.gender.toLowerCase()) {
                score += WEIGHTS.SUBJECT_GENDER;
                signals.push('subjectGender');
            } else {
                // Soft penalty for mixing genders (unless user wants diversity here, which is rare for character feeds)
                score -= WEIGHTS.SUBJECT_GENDER * 0.5;
            }
        }

        if (source.subject.category && candidate.subject.category) {
            if (source.subject.category.toLowerCase() === candidate.subject.category.toLowerCase()) {
                score += WEIGHTS.SUBJECT_CATEGORY;
                signals.push('subjectCategory');
            } else if (inSameCluster(SEMANTIC_CLUSTERS.subjects, source.subject.category, candidate.subject.category)) {
                score += WEIGHTS.SUBJECT_CATEGORY * 0.5;
                signals.push('subjectCluster');
            }
        }

        if (source.subject.details && candidate.subject.details) {
            const srcTokens = tokenize(source.subject.details);
            const candTokens = tokenize(candidate.subject.details);
            const similarity = jaccardSimilarity(srcTokens, candTokens);
            score += similarity * WEIGHTS.SUBJECT_DETAILS_OVERLAP;
            if (similarity > 0.2) signals.push('subjectDetails');
        }
    }

    // 2. STYLE MATCHING
    if (source.style && candidate.style) {
        if (source.style.primary && candidate.style.primary) {
            if (source.style.primary.toLowerCase() === candidate.style.primary.toLowerCase()) {
                score += WEIGHTS.STYLE_PRIMARY;
                signals.push('stylePrimary');
            } else if (inSameCluster(SEMANTIC_CLUSTERS.styles, source.style.primary, candidate.style.primary)) {
                score += WEIGHTS.STYLE_PRIMARY * 0.4;
                signals.push('styleCluster');
            }
        }

        if (source.style.subGenre && candidate.style.subGenre) {
            if (source.style.subGenre.toLowerCase() === candidate.style.subGenre.toLowerCase()) {
                score += WEIGHTS.STYLE_SUBGENRE;
                signals.push('styleSubGenre');
            }
        }

        if (source.style.technique && candidate.style.technique) {
            if (source.style.technique.toLowerCase() === candidate.style.technique.toLowerCase()) {
                score += WEIGHTS.STYLE_TECHNIQUE;
                signals.push('styleTechnique');
            }
        }
    }

    // 3. STYLE TOKENS
    if (source.styleTokens?.length && candidate.styleTokens?.length) {
        const overlap = arrayOverlap(source.styleTokens, candidate.styleTokens);
        score += overlap * WEIGHTS.STYLE_TOKEN_MATCH;
        if (overlap > 0) signals.push(`styleTokens:${overlap}`);
    }

    // 4. VISUAL COMPOSITION
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
    if (source.colors && candidate.colors) {
        if (source.colors.paletteName && candidate.colors.paletteName) {
            const srcPalette = source.colors.paletteName.toLowerCase();
            const candPalette = candidate.colors.paletteName.toLowerCase();

            if (srcPalette === candPalette) {
                score += WEIGHTS.PALETTE_EXACT;
                signals.push('paletteExact');
            } else {
                const srcWords = tokenize(srcPalette);
                const candWords = tokenize(candPalette);
                if (jaccardSimilarity(srcWords, candWords) > 0.3) {
                    score += WEIGHTS.PALETTE_SIMILARITY;
                    signals.push('paletteSimilar');
                }
            }
        }
    }

    // 6. VIBE/MOOD RESONANCE
    if (source.vibe && candidate.vibe) {
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

        if (source.vibe.tags?.length && candidate.vibe.tags?.length) {
            const overlap = arrayOverlap(source.vibe.tags, candidate.vibe.tags);
            score += overlap * WEIGHTS.VIBE_TAG;
            if (overlap > 0) signals.push(`vibeTags:${overlap}`);
        }
    }

    // Legacy vibeTags
    if (source.discovery?.vibeTags && candidate.discovery?.vibeTags) {
        const overlap = arrayOverlap(source.discovery.vibeTags, candidate.discovery.vibeTags);
        score += overlap * WEIGHTS.VIBE_TAG;
        if (overlap > 0) signals.push(`legacyVibeTags:${overlap}`);
    }

    // 7. ATOMIC TAGS
    if (source.tags?.length && candidate.tags?.length) {
        const overlap = arrayOverlap(source.tags, candidate.tags);
        score += overlap * WEIGHTS.ATOMIC_TAG;
        if (overlap > 0) signals.push(`atomicTags:${overlap}`);
    }

    // 8. ML TRIGGER WORDS
    if (source.mlTraining?.triggerWords?.length && candidate.mlTraining?.triggerWords?.length) {
        const overlap = arrayOverlap(source.mlTraining.triggerWords, candidate.mlTraining.triggerWords);
        score += overlap * WEIGHTS.ML_TRIGGER_WORD;
        if (overlap > 0) signals.push(`triggerWords:${overlap}`);
    }

    // 9. CURATION SIGNALS
    if (source.curation && candidate.curation) {
        if (source.curation.suggestedCollections?.length && candidate.curation.suggestedCollections?.length) {
            const overlap = arrayOverlap(source.curation.suggestedCollections, candidate.curation.suggestedCollections);
            score += overlap * WEIGHTS.COLLECTION_MATCH;
            if (overlap > 0) signals.push(`collections:${overlap}`);
        }

        if (source.curation.score && candidate.curation.score) {
            const srcTier = Math.floor(source.curation.score / 3);
            const candTier = Math.floor(candidate.curation.score / 3);
            if (srcTier === candTier) {
                score += WEIGHTS.QUALITY_TIER_MATCH;
                signals.push('qualityTier');
            }
        }
    }

    // 10. SUITABILITY MATCHING
    if (source.suitability?.length && candidate.suitability?.length) {
        const overlap = arrayOverlap(source.suitability, candidate.suitability);
        score += overlap * WEIGHTS.SUITABILITY_MATCH;
        if (overlap > 0) signals.push(`suitability:${overlap}`);
    }

    // 11. DISCOVERY/SEARCH QUERIES
    if (source.discovery?.searchQueries?.length && candidate.discovery?.searchQueries?.length) {
        const srcQueries = new Set(source.discovery.searchQueries.flatMap(q => tokenize(q)));
        const candQueries = new Set(candidate.discovery.searchQueries.flatMap(q => tokenize(q)));
        const similarity = jaccardSimilarity(srcQueries, candQueries);
        score += similarity * WEIGHTS.SEARCH_QUERY_OVERLAP * 5;
        if (similarity > 0.1) signals.push('searchQueries');
    }

    // 12. PROMPT ANALYSIS
    if (source.prompt && candidate.prompt) {
        const srcTokens = tokenize(source.prompt);
        const candTokens = tokenize(candidate.prompt);
        const wordOverlap = [...srcTokens].filter(t => candTokens.has(t)).length;
        score += wordOverlap * WEIGHTS.PROMPT_WORD_MATCH;
        if (wordOverlap > 3) signals.push(`promptWords:${wordOverlap}`);

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
    if (source.modelId && candidate.modelId && source.modelId === candidate.modelId) {
        score += WEIGHTS.MODEL_MATCH;
        signals.push('modelMatch');
    }

    // 14. FRESHNESS BOOST
    const fresh = freshnessScore(candidate.createdAt, WEIGHTS.FRESHNESS_BOOST);
    score += fresh;
    if (fresh > 0) signals.push(`freshness:${fresh.toFixed(1)}`);

    // 15. CONTROLLED RANDOMNESS
    score += Math.random() * WEIGHTS.RANDOM_JITTER;

    return { score, signals };
}

// ============================================================================
// DIVERSITY-AWARE SELECTION ALGORITHMS
// ============================================================================

/**
 * Select items while enforcing strict diversity limits across multiple axes.
 * Uses diminishing returns: the more items of a type selected, the harder to add more.
 */
function diversityAwareSelect(scoredItems, limit, diversityLimits = DIVERSITY_LIMITS) {
    const selected = [];
    const counts = {
        models: {},
        primaryStyles: {},
        subGenres: {},
        moods: {},
        moodClusters: {},
        palettes: {},
        paletteClusters: {},
        subjectCategories: {},
        subjectClusters: {},
        styleClusters: {},
    };

    // Track used fingerprint combinations for uniqueness scoring
    const usedFingerprints = new Set();

    for (const { item, score } of scoredItems) {
        if (selected.length >= limit) break;

        const fp = getDiversityFingerprint(item);

        // Check hard limits
        if ((counts.models[fp.modelId] || 0) >= diversityLimits.maxSameModel) continue;
        if ((counts.primaryStyles[fp.primaryStyle] || 0) >= diversityLimits.maxSamePrimaryStyle) continue;
        if ((counts.subGenres[fp.subGenre] || 0) >= diversityLimits.maxSameSubGenre) continue;
        if ((counts.moods[fp.mood] || 0) >= diversityLimits.maxSameMood) continue;
        if ((counts.palettes[fp.palette] || 0) >= diversityLimits.maxSamePalette) continue;
        if ((counts.subjectCategories[fp.subjectCategory] || 0) >= diversityLimits.maxSameSubjectCategory) continue;

        // Create uniqueness signature
        const signature = `${fp.styleCluster}-${fp.moodCluster}-${fp.subjectCluster}`;
        const isUnique = !usedFingerprints.has(signature);

        // Accept the item
        selected.push(item);
        usedFingerprints.add(signature);

        // Update counts
        counts.models[fp.modelId] = (counts.models[fp.modelId] || 0) + 1;
        counts.primaryStyles[fp.primaryStyle] = (counts.primaryStyles[fp.primaryStyle] || 0) + 1;
        counts.subGenres[fp.subGenre] = (counts.subGenres[fp.subGenre] || 0) + 1;
        counts.moods[fp.mood] = (counts.moods[fp.mood] || 0) + 1;
        counts.moodClusters[fp.moodCluster] = (counts.moodClusters[fp.moodCluster] || 0) + 1;
        counts.palettes[fp.palette] = (counts.palettes[fp.palette] || 0) + 1;
        counts.paletteClusters[fp.paletteCluster] = (counts.paletteClusters[fp.paletteCluster] || 0) + 1;
        counts.subjectCategories[fp.subjectCategory] = (counts.subjectCategories[fp.subjectCategory] || 0) + 1;
        counts.subjectClusters[fp.subjectCluster] = (counts.subjectClusters[fp.subjectCluster] || 0) + 1;
        counts.styleClusters[fp.styleCluster] = (counts.styleClusters[fp.styleCluster] || 0) + 1;
    }

    return selected;
}

/**
 * Cluster-based rotation sampling.
 * Ensures representation from multiple style/mood clusters.
 */
function clusterRotationSample(candidates, limit) {
    // Group candidates by their style cluster
    const clusters = {};

    for (const item of candidates) {
        const fp = getDiversityFingerprint(item);
        const clusterKey = `${fp.styleCluster}-${fp.moodCluster}`;

        if (!clusters[clusterKey]) {
            clusters[clusterKey] = [];
        }
        clusters[clusterKey].push(item);
    }

    // Shuffle each cluster
    const clusterKeys = shuffle(Object.keys(clusters));
    for (const key of clusterKeys) {
        clusters[key] = shuffle(clusters[key]);
    }

    // Round-robin pick from clusters
    const selected = [];
    let clusterIndex = 0;

    while (selected.length < limit && clusterKeys.length > 0) {
        const key = clusterKeys[clusterIndex % clusterKeys.length];
        const cluster = clusters[key];

        if (cluster.length > 0) {
            selected.push(cluster.shift());
        } else {
            // Remove exhausted cluster
            const idx = clusterKeys.indexOf(key);
            if (idx > -1) clusterKeys.splice(idx, 1);
            if (clusterKeys.length === 0) break;
        }

        clusterIndex++;
    }

    return selected;
}

/**
 * Weighted random sampling with diversity penalty.
 * Items from over-represented categories have lower selection probability.
 */
function weightedDiversitySample(scoredItems, limit, diversityLimits = DIVERSITY_LIMITS) {
    const selected = [];
    const counts = {
        models: {},
        styles: {},
        moods: {},
        palettes: {},
        subjects: {},
    };

    // Create a working pool
    let pool = [...scoredItems];

    while (selected.length < limit && pool.length > 0) {
        // Calculate adjusted weights based on current diversity
        const weights = pool.map(({ item, score }) => {
            const fp = getDiversityFingerprint(item);
            let penalty = 0;

            // Diminishing returns: penalty increases with count
            const modelCount = counts.models[fp.modelId] || 0;
            const styleCount = counts.styles[fp.primaryStyle] || 0;
            const moodCount = counts.moods[fp.mood] || 0;
            const paletteCount = counts.palettes[fp.palette] || 0;
            const subjectCount = counts.subjects[fp.subjectCategory] || 0;

            penalty += modelCount * 3;
            penalty += styleCount * 2;
            penalty += moodCount * 1.5;
            penalty += paletteCount * 1.5;
            penalty += subjectCount * 1;

            // Apply penalty as multiplier (softer than subtraction)
            const adjustedScore = Math.max(0.1, score * Math.exp(-penalty * 0.1));

            return adjustedScore;
        });

        // Weighted random selection
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let selectedIndex = 0;

        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                selectedIndex = i;
                break;
            }
        }

        const chosen = pool[selectedIndex];
        const fp = getDiversityFingerprint(chosen.item);

        // Check hard limits before accepting
        const overLimit =
            (counts.models[fp.modelId] || 0) >= diversityLimits.maxSameModel ||
            (counts.styles[fp.primaryStyle] || 0) >= diversityLimits.maxSamePrimaryStyle ||
            (counts.moods[fp.mood] || 0) >= diversityLimits.maxSameMood;

        if (overLimit) {
            // Remove from pool and continue
            pool.splice(selectedIndex, 1);
            continue;
        }

        // Accept selection
        selected.push(chosen.item);

        // Update counts
        counts.models[fp.modelId] = (counts.models[fp.modelId] || 0) + 1;
        counts.styles[fp.primaryStyle] = (counts.styles[fp.primaryStyle] || 0) + 1;
        counts.moods[fp.mood] = (counts.moods[fp.mood] || 0) + 1;
        counts.palettes[fp.palette] = (counts.palettes[fp.palette] || 0) + 1;
        counts.subjects[fp.subjectCategory] = (counts.subjects[fp.subjectCategory] || 0) + 1;

        // Remove from pool
        pool.splice(selectedIndex, 1);
    }

    return selected;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Main relevance calculation function.
 * Now with built-in diversity enforcement.
 */
export function calculateRelevance(source, candidates, limit = 12) {
    if (!source || !candidates || candidates.length === 0) return [];

    const scored = candidates
        .filter(c => c.id !== source.id)
        .map(candidate => {
            const { score, signals } = scoreCandidate(source, candidate);
            return { item: candidate, score, signals };
        })
        .sort((a, b) => b.score - a.score);

    // Use diversity-aware selection instead of simple slice
    return diversityAwareSelect(scored, limit);
}

/**
 * Gets a highly diversified list of recommendations.
 * Combines relevance-based selection with exploration slots.
 * 
 * Strategy:
 * - 40% from relevance-scored pool (with diversity limits)
 * - 35% from weighted diversity sampling (diminishing returns)
 * - 25% pure exploration (cluster rotation)
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

    // Calculate slot allocations
    const relevanceSlots = Math.floor(limit * 0.4);
    const diversitySlots = Math.floor(limit * 0.35);
    const explorationSlots = limit - relevanceSlots - diversitySlots;

    const selectedIds = new Set();
    const result = [];

    // 2. Fill relevance slots (top scores with diversity limits)
    const relevancePicks = diversityAwareSelect(scored, relevanceSlots);
    for (const item of relevancePicks) {
        selectedIds.add(item.id);
        result.push(item);
    }

    // 3. Fill diversity slots (weighted sampling from remaining)
    const remainingForDiversity = scored.filter(s => !selectedIds.has(s.item.id));
    const diversityPicks = weightedDiversitySample(remainingForDiversity, diversitySlots);
    for (const item of diversityPicks) {
        selectedIds.add(item.id);
        result.push(item);
    }

    // 4. Fill exploration slots (cluster rotation from entire remaining pool)
    const remainingForExploration = candidates.filter(c =>
        c.id !== source.id && !selectedIds.has(c.id)
    );
    const explorationPicks = clusterRotationSample(remainingForExploration, explorationSlots);
    for (const item of explorationPicks) {
        selectedIds.add(item.id);
        result.push(item);
    }

    // 5. Final shuffle to mix presentation order
    return shuffle(result);
}

/**
 * Gets recommendations excluding a history of seen items.
 * Perfect for infinite scroll that avoids repetition.
 */
export function getRecommendationsWithHistory(source, candidates, seenIds = [], limit = 10) {
    if (!source || !candidates || candidates.length === 0) return [];

    const seenSet = new Set(seenIds);
    const unseen = candidates.filter(c => c.id !== source.id && !seenSet.has(c.id));

    if (unseen.length === 0) {
        // All items seen - do pure shuffle of candidates excluding source
        return shuffle(candidates.filter(c => c.id !== source.id)).slice(0, limit);
    }

    return getDiversifiedRecommendations(source, unseen, limit);
}

/**
 * Gets recommendations with explicit diversity controls.
 */
export function getBalancedRecommendations(source, candidates, options = {}) {
    const {
        limit = 12,
        maxSameModel = 2,
        maxSamePrimaryStyle = 3,
        maxSameSubGenre = 2,
        maxSameMood = 3,
        maxSamePalette = 2,
        maxSameSubjectCategory = 3,
    } = options;

    if (!source || !candidates || candidates.length === 0) return [];

    const customLimits = {
        maxSameModel,
        maxSamePrimaryStyle,
        maxSameSubGenre,
        maxSameMood,
        maxSamePalette,
        maxSameSubjectCategory,
        explorationRatio: 0.2,
    };

    const scored = candidates
        .filter(c => c.id !== source.id)
        .map(candidate => {
            const { score } = scoreCandidate(source, candidate);
            return { item: candidate, score };
        })
        .sort((a, b) => b.score - a.score);

    return diversityAwareSelect(scored, limit, customLimits);
}

/**
 * Finds images that share specific attributes with diversity.
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
            score: matcher(source, candidate) + Math.random() * 2 // Higher jitter for variety
        }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

    // Use cluster rotation for even more diversity within attribute matches
    const topMatches = scored.slice(0, Math.floor(limit * 0.6)).map(s => s.item);
    const otherMatches = clusterRotationSample(
        scored.slice(Math.floor(limit * 0.6)).map(s => s.item),
        Math.ceil(limit * 0.4)
    );

    return shuffle([...topMatches, ...otherMatches]).slice(0, limit);
}

/**
 * Ultra-diverse exploration mode - maximum variety.
 * Great for "Surprise Me" or discovery features.
 */
export function getExplorationRecommendations(candidates, limit = 10, excludeIds = []) {
    const excludeSet = new Set(excludeIds);
    const available = candidates.filter(c => !excludeSet.has(c.id));

    if (available.length === 0) return [];

    // Pure cluster rotation with extra shuffling
    return clusterRotationSample(shuffle(available), limit);
}

/**
 * Get a "journey" - a coherent but diverse path through images.
 * Each step is somewhat related to the previous but introduces new elements.
 */
export function getImageJourney(startImage, candidates, steps = 8) {
    if (!startImage || !candidates || candidates.length === 0) return [];

    const journey = [startImage];
    const usedIds = new Set([startImage.id]);
    let currentImage = startImage;

    // Track attribute diversity through the journey
    const attributeHistory = {
        styles: [],
        moods: [],
        subjects: [],
    };

    for (let i = 0; i < steps; i++) {
        // Get candidates not yet in journey
        const available = candidates.filter(c => !usedIds.has(c.id));
        if (available.length === 0) break;

        // Score candidates based on:
        // 1. Some similarity to current image (for coherence)
        // 2. Difference from journey history (for progression)
        const scored = available.map(candidate => {
            const { score: relevanceScore } = scoreCandidate(currentImage, candidate);
            const fp = getDiversityFingerprint(candidate);

            // Penalize attributes we've seen in the journey
            let diversityPenalty = 0;
            if (attributeHistory.styles.includes(fp.primaryStyle)) diversityPenalty += 5;
            if (attributeHistory.moods.includes(fp.mood)) diversityPenalty += 3;
            if (attributeHistory.subjects.includes(fp.subjectCategory)) diversityPenalty += 3;

            // Some relevance is good, but not too much (avoid loops)
            const idealRelevance = 15; // Sweet spot
            const relevanceDeviation = Math.abs(relevanceScore - idealRelevance);

            const finalScore = relevanceScore - diversityPenalty - (relevanceDeviation * 0.5) + (Math.random() * 5);

            return { item: candidate, score: finalScore };
        }).sort((a, b) => b.score - a.score);

        if (scored.length === 0) break;

        // Pick from top 5 randomly for variety
        const topN = scored.slice(0, Math.min(5, scored.length));
        const nextImage = topN[Math.floor(Math.random() * topN.length)].item;

        journey.push(nextImage);
        usedIds.add(nextImage.id);

        // Update history
        const nextFp = getDiversityFingerprint(nextImage);
        attributeHistory.styles.push(nextFp.primaryStyle);
        attributeHistory.moods.push(nextFp.mood);
        attributeHistory.subjects.push(nextFp.subjectCategory);

        currentImage = nextImage;
    }

    return journey;
}
