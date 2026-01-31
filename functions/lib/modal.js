import { logger } from "./utils.js";

/**
 * ModalAPI handles communication with the Flux-Klein-4B Modal deployment.
 * Supports the asynchronous "submit and poll" pattern.
 */
export class ModalAPI {
    constructor(endpoint = "https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run") {
        this.endpoint = endpoint;
    }

    /**
     * Submits an edit job to the Modal API.
     * @param {Object} params - The request parameters (prompt, image, num_steps, etc.)
     * @returns {Promise<string>} The job ID.
     */
    async submitEdit(params) {
        const url = `${this.endpoint}/edit`;

        // Map common frontend params to Modal API params
        const body = {
            prompt: params.prompt,
            image: params.image,
            num_steps: params.num_steps || params.steps || 4,
            width: params.width || 1024,
            height: params.height || 1024,
            seed: params.seed || 42,
            use_cache: params.use_cache !== false,
            webhook_url: params.webhook_url || null
        };

        const { fetchWithRetry } = await import("./utils.js");
        logger.info(`[ModalAPI] Submitting edit job to ${url}`, { prompt: body.prompt.substring(0, 50) });

        try {
            const response = await fetchWithRetry(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                timeout: 30000 // 30s timeout for submission
            });

            const data = await response.json();
            if (!data.job_id) {
                logger.error("[ModalAPI] Submission failed: No job_id", null, { data });
                throw new Error(`Modal API did not return a job_id: ${JSON.stringify(data)}`);
            }

            logger.info(`[ModalAPI] Submission successful. Job ID: ${data.job_id}`);
            return data.job_id;
        } catch (error) {
            logger.error("[ModalAPI] Submission Error", error, {
                url,
                body: { ...body, image: params.image?.startsWith('http') ? params.image : "[BASE64_OMITTED]" }
            });
            throw error;
        }
    }

    /**
     * Polls for the result of a submitted job.
     * @param {string} jobId - The job ID to poll.
     * @param {Object} options - Polling options (maxRetries, delay).
     * @returns {Promise<Buffer>} The image data as a Buffer.
     */
    async pollResult(jobId, options = {}) {
        const { maxRetries = 60, delay = 2000 } = options;
        const url = `${this.endpoint}/result/${jobId}`;

        logger.info(`[ModalAPI] Starting poll for job ${jobId} at ${url}`);

        for (let i = 0; i < maxRetries; i++) {
            const response = await fetch(url);

            if (response.status === 200) {
                const contentType = response.headers.get("content-type") || "";
                if (contentType.includes("image/")) {
                    logger.info(`[ModalAPI] Job ${jobId} completed successfully.`);
                    const arrayBuffer = await response.arrayBuffer();
                    return Buffer.from(arrayBuffer);
                }

                // If not an image, it might be a status JSON
                const data = await response.json().catch(() => ({}));
                if (data.status === "failed") {
                    logger.error(`[ModalAPI] Job ${jobId} explicitly failed`, null, { data });
                    throw new Error(`Modal Job Failed: ${data.error || "Unknown error"}`);
                }

                if (data.status === "generating" || data.status === "queued") {
                    // Continue polling
                    if (i % 5 === 0) logger.info(`[ModalAPI] Job ${jobId} status: ${data.status}...`);
                } else {
                    logger.warn(`[ModalAPI] Unexpected response status 200 with JSON:`, data);
                }
            } else if (response.status === 200) {
                // Duplicate handling just in case, though handled above
            } else if (response.status === 404) {
                // Job might not be in the results DB yet if just submitted
                if (i % 5 === 0) logger.info(`[ModalAPI] Job ${jobId} not found (404), continuing poll...`);
            } else if (!response.ok) {
                const errorText = await response.text();
                logger.error(`[ModalAPI] Polling error for job ${jobId}`, null, { status: response.status, errorText });
                throw new Error(`Modal Polling Failed (${response.status}): ${errorText}`);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }

        logger.error(`[ModalAPI] Polling timed out for job ${jobId}`);
        throw new Error(`Modal Polling Timed Out for job: ${jobId}`);
    }

    /**
     * High-level helper to submit and wait for result.
     */
    async editAndWait(params, pollOptions = {}) {
        const jobId = await this.submitEdit(params);
        return await this.pollResult(jobId, pollOptions);
    }
}

export const modalAPI = new ModalAPI();
