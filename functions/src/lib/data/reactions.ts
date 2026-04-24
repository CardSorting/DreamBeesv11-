export interface Reaction {
    keywords: string[];
    textPrompt: string;
    emotion: string;
}

export const REACTIONS: Record<string, Reaction> = {
    'laugh': {
        keywords: ['*laughs*', 'haha', 'lol', 'lmao', '*giggles*'],
        textPrompt: "Hahaha, that's hilarious!",
        emotion: 'Happy'
    },
    'gasp': {
        keywords: ['*gasps*', 'omg', 'no way', '*shocked*'],
        textPrompt: "Oh my god! No way!",
        emotion: 'Excited'
    },
    'sigh': {
        keywords: ['*sighs*', 'ugh', 'bruh'],
        textPrompt: "Ugh, seriously?",
        emotion: 'Sad'
    },
    'hmm': {
        keywords: ['hmm', 'hmmm', '*thinks*'],
        textPrompt: "Hmm, let me think about that.",
        emotion: 'Neutral'
    }
};

/**
 * Checks if the text corresponds to a static reaction.
 * @param {string} text 
 * @returns {object|null} The reaction object or null.
 */
export const getReaction = (text: string): (Reaction & { type: string; key: string }) | null => {
    if (!text) { return null; }
    const lower = text.toLowerCase().trim();

    for (const [key, data] of Object.entries(REACTIONS)) {
        if (data.keywords.some(k => lower === k || lower.startsWith(k) || lower.endsWith(k))) {
            return { type: 'static', ...data, key };
        }
    }
    return null;
};
