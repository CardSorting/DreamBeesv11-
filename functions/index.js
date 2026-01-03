import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("./dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json");

initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

// Environment variables should be set in Firebase Functions config
// firebase functions:config:set huggingface.token="..." b2.key_id="..." ...
// Or for v2, use params or process.env if deployed with .env support

const B2_ENDPOINT = process.env.B2_ENDPOINT;
const B2_REGION = process.env.B2_REGION;
const B2_BUCKET = process.env.B2_BUCKET;
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL;

const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

export const generateImage = onDocumentCreated(
    {
        document: "generation_queue/{requestId}",
        timeoutSeconds: 300, // 5 minutes max
        memory: "1GiB",
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }

        const data = snapshot.data();
        const requestId = event.params.requestId;

        // Prevent infinite loops or re-runs if already processed
        if (data.status !== "pending") {
            return;
        }

        try {
            // Update status to processing
            await snapshot.ref.update({ status: "processing" });

            const { prompt, modelId, userId, negative_prompt, steps, cfg, aspectRatio, scheduler } = data;

            if (!B2_KEY_ID) throw new Error("Missing B2 credentials");

            // Define resolution mapping for SDXL
            const resolutionMap = {
                '1:1': { width: 1024, height: 1024 },
                '2:3': { width: 832, height: 1216 },
                '3:2': { width: 1216, height: 832 },
                '9:16': { width: 768, height: 1344 },
                '16:9': { width: 1344, height: 768 }
            };

            const resolution = resolutionMap[aspectRatio] || resolutionMap['1:1'];

            // 1. Call Modal Endpoint
            console.log(`Generating image for ${requestId} (${aspectRatio} - ${resolution.width}x${resolution.height}) using Modal endpoint...`);

            // Construct query parameters with user settings or defaults
            const params = new URLSearchParams({
                prompt: prompt,
                negative_prompt: negative_prompt || "",
                steps: (steps || 30).toString(),
                cfg: (cfg || 5.0).toString(),
                width: resolution.width.toString(),
                height: resolution.height.toString(),
                scheduler: scheduler || 'DPM++ 2M Karras'
            });

            const response = await fetch(
                `https://cardsorting--sdxl-cat-carrier-model-web-inference.modal.run?${params.toString()}`,
                {
                    method: "GET"
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Modal API Error: ${errText}`);
            }

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 2. Upload to Backblaze B2
            const filename = `generated/${userId}/${Date.now()}.png`;
            console.log(`Uploading to B2: ${filename}...`);

            const command = new PutObjectCommand({
                Bucket: B2_BUCKET,
                Key: filename,
                Body: buffer,
                ContentType: "image/png",
            });

            await s3Client.send(command);
            const imageUrl = `${B2_PUBLIC_URL}/${filename}`;

            // 3. Save to main 'images' collection
            const imageDoc = {
                userId,
                prompt,
                modelId,
                imageUrl,
                createdAt: new Date(), // Use server timestamp in real deployment if possible, simplified here
                originalrequestId: requestId
            };

            const imageRef = await db.collection("images").add(imageDoc);
            console.log(`Image saved to images/${imageRef.id}`);

            // 4. Update queue status to completed
            await snapshot.ref.update({
                status: "completed",
                imageUrl: imageUrl,
                completedAt: new Date(),
                resultImageId: imageRef.id
            });

        } catch (error) {
            console.error("Error generating image:", error);
            await snapshot.ref.update({
                status: "failed",
                error: error.message
            });
        }
    }
);
