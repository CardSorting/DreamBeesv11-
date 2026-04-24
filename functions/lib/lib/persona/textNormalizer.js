export const normalizeForTts = (text) => {
    if (!text) {
        return "";
    }
    let normalized = text;
    // 1. Replace URLs
    normalized = normalized.replace(/https?:\/\/[^\s]+/g, "a link");
    // 2. Expand Slang / Defaults
    const slangMap = {
        "brb": "be right back",
        "idk": "I don't know",
        "omg": "oh my god",
        "lol": "laughing out loud",
        "ty": "thank you",
        "np": "no problem",
        "thx": "thanks",
        "plz": "please",
        "rn": "right now",
        "msg": "message"
    };
    // Replace whole words only
    for (const [slang, full] of Object.entries(slangMap)) {
        const regex = new RegExp(`\\b${slang}\\b`, 'gi');
        normalized = normalized.replace(regex, full);
    }
    // 3. Strip Text Emoticons
    const emoticonRegex = /[:;=]-?[)D(|/\\pP3]/g;
    normalized = normalized.replace(emoticonRegex, "");
    // 4. Repeated Punctuation Cleanup
    normalized = normalized.replace(/([?!.])\1+/g, "$1"); // "!!!" -> "!"
    return normalized.trim();
};
//# sourceMappingURL=textNormalizer.js.map