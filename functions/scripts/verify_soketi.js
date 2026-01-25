
import Pusher from 'pusher';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from functions directory
dotenv.config({ path: join(__dirname, '../.env') });

const pusher = new Pusher({
    appId: process.env.SOKETI_APP_ID || 'app-id',
    key: process.env.SOKETI_APP_KEY || 'app-key',
    secret: process.env.SOKETI_APP_SECRET || 'app-secret',
    host: process.env.SOKETI_HOST || '127.0.0.1',
    port: process.env.SOKETI_PORT || '6001',
    useTLS: process.env.SOKETI_USE_TLS === 'true',
});

const channel = 'chat-test-image-test-user';
const event = 'new-message';
const data = {
    role: 'model',
    text: 'Hello from the verification script! Soketi is working.',
    timestamp: Date.now()
};

console.log(`[TEST] Triggering event "${event}" on channel "${channel}"...`);

pusher.trigger(channel, event, data)
    .then(() => {
        console.log('[SUCCESS] Event triggered successfully.');
        process.exit(0);
    })
    .catch(err => {
        console.error('[ERROR] Failed to trigger event:', err);
        process.exit(1);
    });
