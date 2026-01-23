// Safety Center Constants

// Consensus Thresholds
export const HIDE_THRESHOLD = -5;
export const SAFE_THRESHOLD = 5;

// Milestone thresholds for celebrations
export const MILESTONES = [5, 10, 25, 50, 100];

// Trust Tiers based on karma
export const TRUST_TIERS = {
    bronze: { min: 0, max: 49, label: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-500/10' },
    silver: { min: 50, max: 199, label: 'Silver', color: 'text-zinc-300', bg: 'bg-zinc-500/10' },
    gold: { min: 200, max: Infinity, label: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
};

export const getTrustTier = (karma) => {
    if (karma >= 200) return TRUST_TIERS.gold;
    if (karma >= 50) return TRUST_TIERS.silver;
    return TRUST_TIERS.bronze;
};

// Reason icons mapping
export const REASON_ICONS = {
    nsfw: { icon: '🔞', label: 'NSFW Content', color: 'text-red-400' },
    spam: { icon: '📢', label: 'Spam', color: 'text-yellow-400' },
    harmful: { icon: '🚫', label: 'Harmful', color: 'text-red-500' },
    violence: { icon: '⚔️', label: 'Violence', color: 'text-orange-400' },
    copyright: { icon: '©️', label: 'Copyright', color: 'text-blue-400' },
    user_flagged: { icon: '🚩', label: 'Community Flagged', color: 'text-zinc-400' },
    default: { icon: '⚠️', label: 'Flagged', color: 'text-zinc-400' }
};

export const getReasonInfo = (reason) => {
    const key = reason?.toLowerCase()?.replace(/[^a-z]/g, '') || 'default';
    return REASON_ICONS[key] || REASON_ICONS.default;
};

// Helper to convert score to percentage for score bar
export const scoreToPercent = (score) => {
    const normalized = Math.max(HIDE_THRESHOLD, Math.min(SAFE_THRESHOLD, score));
    return ((normalized - HIDE_THRESHOLD) / (SAFE_THRESHOLD - HIDE_THRESHOLD)) * 100;
};

// Time ago helper
export const timeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const seconds = Math.floor((Date.now() - timestamp.seconds * 1000) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};
