
import { getS3Client } from './lib/utils.js';
import { VertexAI } from '@google-cloud/vertexai';

console.log("Starting runtime checks...");

try {
    console.log("Testing getS3Client...");
    const s3 = await getS3Client();
    console.log("S3 Client initialized:", !!s3);
} catch (e) {
    console.error("S3 Client Failed:", e);
}

try {
    console.log("Testing VertexAI init...");
    const project = process.env.GCLOUD_PROJECT || "dreambees-alchemist";
    const vertexAI = new VertexAI({ project, location: 'us-central1' });
    const model = vertexAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    console.log("VertexAI Model initialized:", !!model);
} catch (e) {
    console.error("VertexAI Failed:", e);
}

console.log("Runtime checks complete.");
