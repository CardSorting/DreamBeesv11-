const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Helper to get B2 env vars from any available source
function getB2Env() {
    return {
        endpoint: process.env.VITE_B2_ENDPOINT || process.env.B2_ENDPOINT,
        region: process.env.VITE_B2_REGION || process.env.B2_REGION,
        bucket: process.env.VITE_B2_BUCKET || process.env.B2_BUCKET,
        keyId: process.env.VITE_B2_KEY_ID || process.env.B2_KEY_ID,
        appKey: process.env.VITE_B2_APP_KEY || process.env.B2_APP_KEY,
        publicUrl: process.env.VITE_B2_PUBLIC_URL || process.env.B2_PUBLIC_URL
    };
}

// Initial load from root .env or environment
let b2Env = getB2Env();

// If missing in root, try loading from functions/.env
if (!b2Env.endpoint || !b2Env.bucket || !b2Env.keyId || !b2Env.appKey) {
    const functionsEnvPath = path.resolve(__dirname, '../../functions/.env');
    if (fs.existsSync(functionsEnvPath)) {
        require('dotenv').config({ path: functionsEnvPath });
        b2Env = getB2Env();
        if (b2Env.endpoint) {
            console.log('💡 Loaded configuration from functions/.env');
        }
    }
}

const B2_ENDPOINT = b2Env.endpoint;
const B2_REGION = b2Env.region;
const B2_BUCKET = b2Env.bucket;
const B2_KEY_ID = b2Env.keyId;
const B2_APP_KEY = b2Env.appKey;
const B2_PUBLIC_URL = b2Env.publicUrl;

// Validate required environment variables
const missingVars = [];
if (!B2_ENDPOINT) missingVars.push('B2_ENDPOINT');
if (!B2_BUCKET) missingVars.push('B2_BUCKET');
if (!B2_KEY_ID) missingVars.push('B2_KEY_ID');
if (!B2_APP_KEY) missingVars.push('B2_APP_KEY');
if (!B2_PUBLIC_URL) missingVars.push('B2_PUBLIC_URL');

if (missingVars.length > 0) {
    console.error("ERROR: Missing required B2 environment variables:");
    missingVars.forEach(v => console.error(`  - ${v}`));
    console.error("\nPlease ensure these are set in your .env file.");
    process.exit(1);
}

// Validate credentials are not empty strings
if (!B2_KEY_ID.trim() || !B2_APP_KEY.trim()) {
    console.error("ERROR: B2 credentials (VITE_B2_KEY_ID and VITE_B2_APP_KEY) cannot be empty!");
    process.exit(1);
}

let s3Client;
try {
    s3Client = new S3Client({
        endpoint: B2_ENDPOINT,
        region: B2_REGION || 'us-west-000', // Default region if not set
        credentials: {
            accessKeyId: B2_KEY_ID.trim(),
            secretAccessKey: B2_APP_KEY.trim(),
        },
    });
} catch (error) {
    console.error("ERROR: Failed to create S3Client:", error.message);
    process.exit(1);
}

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
        if (error.name === 'InvalidAccessKeyId' || error.message.includes('credential')) {
            console.error("\n❌ B2 Credential Error:");
            console.error("   Your B2 credentials are invalid or expired.");
            console.error("   Please check:");
            console.error("   1. VITE_B2_KEY_ID is correct");
            console.error("   2. VITE_B2_APP_KEY is correct");
            console.error("   3. The keys have not expired");
            console.error("   4. The keys have permission to upload to the bucket");
        } else if (error.name === 'NoSuchBucket') {
            console.error("\n❌ B2 Bucket Error:");
            console.error(`   Bucket "${B2_BUCKET}" does not exist or is not accessible.`);
            console.error("   Please check VITE_B2_BUCKET in your .env file.");
        } else {
            console.error("\n❌ B2 Upload Error:", error.message);
            if (error.$metadata) {
                console.error("   Status Code:", error.$metadata.httpStatusCode);
                console.error("   Request ID:", error.$metadata.requestId);
            }
        }
        throw error;
    }
}

/**
 * Validates B2 credentials by attempting to list objects (dry run)
 */
async function validateCredentials() {
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
    try {
        const command = new ListObjectsV2Command({
            Bucket: B2_BUCKET,
            MaxKeys: 1
        });
        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error("Credential validation failed:", error.message);
        return false;
    }
}

module.exports = {
    uploadToB2,
    validateCredentials
};
