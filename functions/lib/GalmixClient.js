

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

            await new Promise(resolve => setTimeout(resolve, poll_interval));
        }
    }
}
