
import fs from 'fs/promises';

/**
 * GalmixClient - A Node.js client for the Galmix Image Generation API.
 * Based on the Python implementation in Galmix API Documentation & SDK.md
 */
export class GalmixClient {
    /**
     * @param {string} baseUrl - The base URL of the Galmix API (e.g., http://localhost:8000)
     */
    constructor(baseUrl = "https://api.dreambeesai.com") {
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    /**
     * Submits a generation job and polls until completion.
     * @param {string} prompt - The text description of the image.
     * @param {Object} options - Optional parameters for the generation.
     * @param {string} options.negative_prompt - What to avoid in the image.
     * @param {number} options.steps - Number of denoising steps (max 100).
     * @param {number} options.guidance_scale - CFG Scale (1.0 - 20.0).
     * @param {number} options.poll_interval - Time between status checks in ms (default 1000).
     * @param {number} options.timeout - Max time for generation in ms (default 300000).
     * @returns {Promise<Object>} - The result object with base64 image data.
     */
    async generateImage(prompt, options = {}) {
        const {
            negative_prompt = "",
            steps = 30,
            guidance_scale = 7.5,
            poll_interval = 1000,
            timeout = 300000
        } = options;

        // 1. Submit Job
        const submitUrl = `${this.baseUrl}/v1/generations`;
        const payload = {
            prompt,
            negative_prompt,
            steps,
            guidance_scale
        };

        const submitResp = await fetch(submitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (submitResp.status !== 202) {
            const text = await submitResp.text();
            throw new Error(`Submission failed (${submitResp.status}): ${text}`);
        }

        const data = await submitResp.json();
        const jobId = data.job_id;
        console.log(`Job submitted: ${jobId}`);

        // 2. Poll for Status
        const pollUrl = `${this.baseUrl}/v1/generations/${jobId}`;
        const startTime = Date.now();

        while (true) {
            if (Date.now() - startTime > timeout) {
                throw new Error("Generation timed out.");
            }

            const pollResp = await fetch(pollUrl);
            if (pollResp.status !== 200) {
                throw new Error(`Polling failed (${pollResp.status})`);
            }

            const pollData = await pollResp.json();
            const status = pollData.status.toUpperCase();

            if (status === "COMPLETED" || status === "SUCCESS") {
                return pollData;
            } else if (status === "FAILED") {
                const errorMsg = pollData.error || "Unknown error";
                throw new Error(`Job failed: ${errorMsg}`);
            }

            // Sleep for poll_interval
            await new Promise(resolve => setTimeout(resolve, poll_interval));
        }
    }

    /**
     * Helper to save a base64 string as a file.
     * @param {string} base64Str - The base64 encoded image data.
     * @param {string} filename - The destination filename.
     */
    async saveBase64Image(base64Str, filename) {
        const buffer = Buffer.from(base64Str, 'base64');
        await fs.writeFile(filename, buffer);
        console.log(`Image saved to ${filename}`);
    }
}
