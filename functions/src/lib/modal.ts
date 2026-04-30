/**
 * Modal API Abstraction Layer
 * 
 * Handles interaction with Modal-deployed Flux workers.
 */

import { logger, fetchWithRetry } from "./utils.js";
import { MODAL_ENDPOINT } from "./constants.js";

export interface ModalEditParams {
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

export class ModalAPI {
    private endpoint: string;

    constructor(endpoint = MODAL_ENDPOINT) {
        this.endpoint = endpoint;
    }

    /**
     * Submits an edit job to the Modal API
     */
    async submitEdit(params: ModalEditParams): Promise<string> {
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

        logger.info(`[ModalAPI] Submitting job to ${url}`, {
            prompt: body.prompt?.substring(0, 50)
        });

        try {
            const response = await fetchWithRetry(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                timeout: 45000
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Modal API Failed (${response.status}): ${errorText}`);
            }

            const data = await response.json() as any;
            if (!data.job_id) {
                throw new Error(`No job_id returned: ${JSON.stringify(data)}`);
            }

            return data.job_id;
        } catch (error: any) {
            logger.error("[ModalAPI] Submission Error", error);
            throw error;
        }
    }

    /**
     * Polls for the result of a submitted job
     */
    async pollResult(jobId: string, options: any = {}): Promise<Buffer> {
        const { maxRetries = 60, initialDelay = 2000, maxDelay = 10000 } = options;
        const url = `${this.endpoint}/result/${jobId}`;
        
        let delay = initialDelay;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url);
                if (response.status === 200) {
                    const contentType = response.headers.get("content-type") || "";
                    if (contentType.includes("image/")) {
                        const arrayBuffer = await response.arrayBuffer();
                        return Buffer.from(arrayBuffer);
                    }
                    
                    const data = await response.json().catch(() => ({})) as any;
                    if (data.status === "failed") {
                        throw new Error(`Job Failed: ${data.error || "Unknown"}`);
                    }
                } else if (response.status !== 404 && !response.ok) {
                    logger.warn(`[ModalAPI] Transient poll error ${response.status}`);
                }
            } catch (error: any) {
                if (error.message.includes("Job Failed")) throw error;
                logger.warn(`[ModalAPI] Poll attempt ${i} failed: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, maxDelay);
        }

        throw new Error(`Polling timed out for job ${jobId}`);
    }

    /**
     * Helper to submit and wait for result
     */
    async editAndWait(params: ModalEditParams, pollOptions = {}): Promise<Buffer> {
        const jobId = await this.submitEdit(params);
        return await this.pollResult(jobId, pollOptions);
    }
}

export const modalAPI = new ModalAPI();
