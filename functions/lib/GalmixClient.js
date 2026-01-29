import { fetchWithTimeout } from "./utils.js";

/**
 * GalmixClient - A Node.js client for the Galmix Image Generation API.
 * Backend implementation for Firebase Functions.
 */
export class GalmixClient {
    /**
     * @param {string} baseUrl - The base URL of the Galmix API.
     */
    constructor(baseUrl = "https://api.dreambeesai.com") {
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    /**
     * Submits a generation job and polls until completion.
     * @param {string} prompt - The text description of the image.
     * @param {Object} options - Optional parameters for the generation.
     * @returns {Promise<Object>} - The result object with base64 image data.
     */
    async generateImage(prompt, options = {}) {
        const {
            negative_prompt = "",
            steps = 30,
            guidance_scale = 7.5,
            poll_interval = 1000,
            timeout = 480000
        } = options;

        // 1. Submit Job
        const submitUrl = `${this.baseUrl}/v1/generations`;
        const payload = {
            prompt,
            negative_prompt,
            steps,
            guidance_scale
        };

        const submitResp = await fetchWithTimeout(submitUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'DreamBees/1.1'
            },
            body: JSON.stringify(payload),
            timeout: 60000 // 60s timeout for initial submission
        });

        if (submitResp.status !== 202) {
            const text = await submitResp.text();
            throw new Error(`Submission failed (${submitResp.status}): ${text}`);
        }

        const data = await submitResp.json();
        const jobId = data.job_id;

        // 2. Poll for Status
        const pollUrl = `${this.baseUrl}/v1/generations/${jobId}`;
        const startTime = Date.now();

        while (true) {
            if (Date.now() - startTime > timeout) {
                console.error(`[Galmix] Job ${jobId} timed out after ${timeout}ms`);
                throw new Error("Generation timed out.");
            }

            console.log(`[Galmix] Polling status for ${jobId}...`);
            const pollResp = await fetchWithTimeout(`${pollUrl}?t=${Date.now()}`, {
                headers: { 'User-Agent': 'DreamBees/1.1' },
                timeout: 45000 // 45s timeout for polling calls
            });
            if (pollResp.status !== 200) {
                console.error(`[Galmix] Polling failed with status ${pollResp.status}`);
                throw new Error(`Polling failed (${pollResp.status})`);
            }

            const pollData = await pollResp.json();
            console.log(`[Galmix] Debug Poll Response:`, JSON.stringify(pollData));
            const status = (pollData.status || "UNKNOWN").toUpperCase();
            console.log(`[Galmix] Job ${jobId} Status: ${status}`);

            if (status === "COMPLETED" || status === "SUCCESS") {
                console.log(`[Galmix] Job ${jobId} finished!`);
                return pollData;
            } else if (status === "FAILED") {
                const errorMsg = pollData.error || "Unknown error";
                console.error(`[Galmix] Job ${jobId} FAILED: ${errorMsg}`);
                throw new Error(`Job failed: ${errorMsg}`);
            }

            await new Promise(resolve => setTimeout(resolve, poll_interval));
        }
    }
}
