import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const B2_ENDPOINT = import.meta.env.VITE_B2_ENDPOINT;
const B2_REGION = import.meta.env.VITE_B2_REGION;
const B2_BUCKET = import.meta.env.VITE_B2_BUCKET;
const B2_KEY_ID = import.meta.env.VITE_B2_KEY_ID;
const B2_APP_KEY = import.meta.env.VITE_B2_APP_KEY;
const B2_PUBLIC_URL = import.meta.env.VITE_B2_PUBLIC_URL;

if (!B2_ENDPOINT || !B2_KEY_ID || !B2_APP_KEY) {
    console.error("Backblaze B2 environment variables are missing!");
}

const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

export async function uploadImageToB2(blob, filename) {
    try {
        const command = new PutObjectCommand({
            Bucket: B2_BUCKET,
            Key: filename,
            Body: blob,
            ContentType: blob.type || 'image/png',
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

export async function listAudioFiles(prefix = 'printeregg/ambient-audio/') {
    try {
        const command = new ListObjectsV2Command({
            Bucket: B2_BUCKET,
            Prefix: prefix,
        });

        const response = await s3Client.send(command);

        if (!response.Contents) return [];

        return response.Contents
            .filter(item => item.Key.endsWith('.mp3') || item.Key.endsWith('.wav') || item.Key.endsWith('.ogg'))
            .map(item => ({
                key: item.Key,
                url: `${B2_PUBLIC_URL}/${item.Key}`
            }));
    } catch (error) {
        console.error("Error listing audio files from B2:", error);
        return [];
    }
}
