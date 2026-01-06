const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const B2_ENDPOINT = process.env.VITE_B2_ENDPOINT;
const B2_REGION = process.env.VITE_B2_REGION;
const B2_BUCKET = process.env.VITE_B2_BUCKET;
const B2_KEY_ID = process.env.VITE_B2_KEY_ID;
const B2_APP_KEY = process.env.VITE_B2_APP_KEY;
const B2_PUBLIC_URL = process.env.VITE_B2_PUBLIC_URL;

if (!B2_ENDPOINT || !B2_KEY_ID || !B2_APP_KEY) {
    console.warn("WARNING: Backblaze B2 environment variables are missing in .env! B2 Uploads will fail.");
}

const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

/**
 * Uploads a buffer or stream to B2
 * @param {Buffer|Stream} body 
 * @param {string} filename Target filename (key)
 * @param {string} contentType MIME type
 * @returns {Promise<string>} Public URL
 */
async function uploadToB2(body, filename, contentType = 'image/png') {
    try {
        const command = new PutObjectCommand({
            Bucket: B2_BUCKET,
            Key: filename,
            Body: body,
            ContentType: contentType,
        });

        await s3Client.send(command);

        // Construct the public URL
        const publicUrl = `${B2_PUBLIC_URL}/${filename}`;
        return publicUrl;
    } catch (error) {
        console.error("Error uploading to Backblaze B2:", error);
        throw error;
    }
}

module.exports = {
    uploadToB2
};
