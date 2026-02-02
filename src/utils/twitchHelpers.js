/**
 * Common formatting helpers for the Twitch-style Persona platform.
 */

/**
 * Formats a viewer count or zap count into a k-shorthand string.
 * @param {number} count 
 * @returns {string}
 */
export const formatTwitchCount = (count) => {
    if (!count || count < 0) return '0';
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
};

/**
 * Returns the HYPE label and color for a given level.
 * @param {number} level 
 * @returns {object}
 */
export const getHypeMetadata = (level) => {
    const levels = {
        1: { label: 'CHILL', color: '#adadb8' },
        2: { label: 'RISING', color: '#a970ff' },
        3: { label: 'HYPE', color: '#a970ff' },
        4: { label: 'HOT', color: '#ff4500' },
        5: { label: 'PEAK', color: '#ffd700' }
    };
    return levels[level] || levels[1];
};

/**
 * Calculates the hype level (1-5) based on a raw score.
 * @param {number} score 
 * @returns {number}
 */
export const calculateHypeLevel = (score) => {
    if (score >= 1000) return 5;
    if (score >= 600) return 4;
    if (score >= 300) return 3;
    if (score >= 100) return 2;
    return 1;
};
