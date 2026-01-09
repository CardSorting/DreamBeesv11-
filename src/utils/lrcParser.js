/**
 * Parses a standard LRC string into an array of LyricLines.
 * Format: [mm:ss.xx] Lyric text
 */
export const parseLrc = (lrcString) => {
    const lines = lrcString.split('\n');
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

    for (const line of lines) {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = line.replace(timeRegex, '').trim();

            if (text) {
                result.push({ time, text });
            }
        }
    }

    // Sort by time just in case
    return result.sort((a, b) => a.time - b.time);
};

export const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
