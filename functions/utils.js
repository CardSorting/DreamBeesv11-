import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { B2_ENDPOINT, B2_REGION, B2_BUCKET, B2_KEY_ID, B2_APP_KEY, B2_PUBLIC_URL } from "./constants.js";
import crypto from 'crypto';

// S3 Client Init
export const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

export async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 60000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

export async function verifyB2FilesExist(originalFilename, thumbFilename) {
    const result = { imageUrl: null, thumbnailUrl: null };
    try {
        if (originalFilename) {
            try {
                await s3Client.send(new HeadObjectCommand({ Bucket: B2_BUCKET, Key: originalFilename }));
                result.imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
            } catch (headError) { /* ignore */ }
        }
        if (thumbFilename) {
            try {
                await s3Client.send(new HeadObjectCommand({ Bucket: B2_BUCKET, Key: thumbFilename }));
                result.thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;
            } catch (headError) { /* ignore */ }
        }
    } catch (error) { console.error(error); }
    return result;
}

export const detectImageFormat = (buffer) => {
    if (buffer.length < 4) return null;
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    // WebP: RIFF...WEBP
    if (buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return 'image/webp';
    }
    return null;
};

export const readFirstBytes = async (responseToRead, numBytes = 12) => {
    const arrayBuffer = await responseToRead.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return null;
    }
    const buffer = Buffer.from(arrayBuffer);
    return buffer.slice(0, Math.min(numBytes, buffer.length));
};

export function getPromptHash(prompt) {
    return crypto.createHash('sha256').update(prompt.trim().toLowerCase()).digest('hex');
}

export function getPromptMetadata(prompt) {
    const clean = prompt.trim();
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = clean.match(emojiRegex) || [];
    return {
        length: clean.length,
        wordCount: clean.split(/\s+/).filter(Boolean).length,
        emojiCount: emojis.length,
        hasNegativeModifiers: /low quality|bad|ugly|deformed/i.test(clean)
    };
}

export function findPrimaryUrl(output) {
    if (!output) return null;

    // 1. Direct string
    if (typeof output === 'string') {
        const cleanOutput = output.trim();
        if (cleanOutput.startsWith('http')) {
            // Check for common media extensions or replicate/s3 patterns
            if (cleanOutput.includes('replicate.delivery') ||
                cleanOutput.match(/\.(mp4|webp|png|jpg|jpeg|gif|mov|m4v)/i) ||
                cleanOutput.includes('b2.content') ||
                cleanOutput.includes('amazonaws.com')) {
                return cleanOutput;
            }
        }
    }

    // 2. Array: recurse on all elements until a URL is found
    if (Array.isArray(output) && output.length > 0) {
        for (const item of output) {
            const found = findPrimaryUrl(item);
            if (found) return found;
        }
        return null; // None found in array
    }

    // 3. Object: recurse on known properties first, then exhaustive scan
    if (typeof output === 'object') {
        // Detailed logging for debugging unknown objects
        const keys = Object.keys(output);
        console.log(`Parsing output object. Type: ${output.constructor?.name || 'Object'}, Keys: ${keys.join(', ')}`);

        // Known keys strategy (prioritize common keys)
        const priorityKeys = ['video', 'output', 'url', 'video_url', 'result', 'data'];
        for (const key of priorityKeys) {
            if (output[key]) {
                const found = findPrimaryUrl(output[key]);
                if (found) return found;
            }
        }

        // Exhaustive scan (fallback)
        for (const key of keys) {
            if (!priorityKeys.includes(key)) {
                // Avoid recursion loops or massive objects?
                // Replicate outputs are usually JSON, so it's safe.
                const found = findPrimaryUrl(output[key]);
                if (found) return found;
            }
        }
    }

    return null;
}
