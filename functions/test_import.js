
import { getS3Client, logger } from './lib/utils.js';
import { VertexAI } from '@google-cloud/vertexai';

logger.info("Starting runtime checks...");

try {
    logger.info("Testing getS3Client...");
    const s3 = await getS3Client();
    logger.info("S3 Client initialized:", { initialized: !!s3 });
} catch (e) {
    logger.error("S3 Client Failed:", e);
}

try {
    logger.info("Testing VertexAI init...");
    const project = process.env.GCLOUD_PROJECT || "dreambees-alchemist";
    const vertexAI = new VertexAI({ project, location: 'us-central1' });
    const model = vertexAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    logger.info("VertexAI Model initialized:", { initialized: !!model });
} catch (e) {
    logger.error("VertexAI Failed:", e);
}

logger.info("Runtime checks complete.");
