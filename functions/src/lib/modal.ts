import { logger } from "./utils.js";
import { MODAL_ENDPOINT } from "./constants.js";

interface ModalEditParams {
    prompt: string;
    image: string;
    num_steps?: number;
    steps?: number;
    guidance_scale?: number;
    width?: number;
    height?: number;
    seed?: number;
    use_cache?: boolean;
    webhook_url?: string | null;
}

interface ModalJobResponse {
    job_id: string;
    status: "queued" | "generating" | "completed" | "failed";
    queue_position?: number;
    estimated_wait_time_seconds?: number;
}

interface ModalStatusResponse {
    status: "queued" | "generating" | "completed" | "failed";
    error?: string;
    progress?: number;
}

/**
 * ModalAPI handles communication with the Flux-Klein-9B Modal deployment.
 */
export class ModalAPI {
    private endpoint: string;

    constructor(endpoint: string = MODAL_ENDPOINT) {
        this.endpoint = endpoint;
    }

    /**
     * Pre-validates the edit parameters before submission.
     */
    private validateParams(params: ModalEditParams): void {
        if (!params.prompt || params.prompt.trim().length === 0) {
            throw new Error("ModalAPI: Prompt is required and cannot be empty.");
        }
        if (!params.image || (!params.image.startsWith('http') && !params.image.startsWith('data:image'))) {
            throw new Error("ModalAPI: Valid image URL or base64 data URI is required.");
        }
        if (params.num_steps && (params.num_steps < 1 || params.num_steps > 50)) {
            logger.warn(`[ModalAPI] num_steps ${params.num_steps} is outside recommended range (1-50).`);
        }
    }

    /**
     * Submits an edit job to the Modal API.
     */
    async submitEdit(params: ModalEditParams): Promise<string> {
        this.validateParams(params);
        const url = `${this.endpoint}/edit`;

        const body = {
            prompt: params.prompt,
            image: params.image,
            num_steps: params.num_steps || params.steps || 4,
            guidance_scale: params.guidance_scale || 3.5,
            width: params.width || 1024,
            height: params.height || 1024,
            seed: params.seed || 42,
            use_cache: params.use_cache !== false,
            webhook_url: params.webhook_url || null
        };

        const { fetchWithRetry } = await import("./utils.js");
        logger.info(`[ModalAPI] Submitting edit job to ${url}`, { 
            prompt: body.prompt?.substring(0, 50),
            image_type: params.image.startsWith('http') ? 'url' : 'base64'
        });

        try {
            const response = await fetchWithRetry(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                timeout: 45000 // Increased timeout for larger payloads
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Modal API Submission Failed (${response.status}): ${errorText}`);
            }

            const data = await response.json() as ModalJobResponse;
            if (!data.job_id) {
                logger.error("[ModalAPI] Submission failed: No job_id", null, { data });
                throw new Error(`Modal API did not return a job_id: ${JSON.stringify(data)}`);
            }

            logger.info(`[ModalAPI] Submission successful. Job ID: ${data.job_id}`, { status: data.status });
            return data.job_id;
        } catch (error: any) {
            logger.error("[ModalAPI] Submission Error", error, {
                url,
                body: { ...body, image: params.image?.startsWith('http') ? params.image : "[BASE64_OMITTED]" }
            });
            throw error;
        }
    }

    /**
     * Polls for the result of a submitted job with exponential backoff.
     */
    async pollResult(jobId: string, options: { maxRetries?: number; initialDelay?: number; maxDelay?: number } = {}): Promise<Buffer> {
        const { maxRetries = 60, initialDelay = 2000, maxDelay = 10000 } = options;
        const url = `${this.endpoint}/result/${jobId}`;

        logger.info(`[ModalAPI] Starting poll for job ${jobId} at ${url}`);

        let delay = initialDelay;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url);

                if (response.status === 200) {
                    const contentType = response.headers.get("content-type") || "";
                    if (contentType.includes("image/")) {
                        logger.info(`[ModalAPI] Job ${jobId} completed successfully.`);
                        const arrayBuffer = await response.arrayBuffer();
                        return Buffer.from(arrayBuffer);
                    }

                    const data = await response.json().catch(() => ({})) as ModalStatusResponse;
                    if (data.status === "failed") {
                        logger.error(`[ModalAPI] Job ${jobId} explicitly failed`, null, { data });
                        throw new Error(`Modal Job Failed: ${data.error || "Unknown error"}`);
                    }

                    if (data.status === "generating" || data.status === "queued") {
                        if (i % 5 === 0) {
                            logger.info(`[ModalAPI] Job ${jobId} status: ${data.status}...`);
                        }
                    } else {
                        logger.warn(`[ModalAPI] Unexpected response status 200 with JSON:`, data);
                    }
                } else if (response.status === 404) {
                    if (i % 5 === 0) {
                        logger.info(`[ModalAPI] Job ${jobId} not found (404), worker may be spinning up...`);
                    }
                } else if (!response.ok) {
                    const errorText = await response.text();
                    logger.error(`[ModalAPI] Polling error for job ${jobId}`, null, { status: response.status, errorText });
                    // Don't throw for transient server errors (5xx) or rate limits (429) - just retry
                    if (response.status < 500 && response.status !== 429) {
                        throw new Error(`Modal Polling Failed (${response.status}): ${errorText}`);
                    }
                }
            } catch (error: any) {
                // If it's our own thrown error, rethrow it
                if (error.message.startsWith("Modal Job Failed") || error.message.startsWith("Modal Polling Failed")) {
                    throw error;
                }
                // Otherwise log and continue polling (transient network errors)
                logger.warn(`[ModalAPI] Polling attempt ${i} failed for job ${jobId}: ${error.message}`);
            }

            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, maxDelay);
        }

        logger.error(`[ModalAPI] Polling timed out for job ${jobId}`, new Error("Timeout"));
        throw new Error(`Modal Polling Timed Out for job: ${jobId}`);
    }

    /**
     * High-level helper to submit and wait for result.
     */
    async editAndWait(params: any, pollOptions: any = {}): Promise<Buffer> {
        const jobId = await this.submitEdit(params);
        return await this.pollResult(jobId, pollOptions);
    }
}

export const modalAPI = new ModalAPI();
