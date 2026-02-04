#!/usr/bin/env node

/**
 * OpenClaw API Key Manager
 * 
 * Usage:
 *   npm run keys
 *   npm run keys list
 *   npm run keys create "My Bot"
 *   npm run keys revoke sk_live_...
 */

import readline from 'readline';
import { spawn } from 'child_process';
import 'dotenv/config'; // Loads .env automatically

// URL
const API_URL = "https://dreambeesai.com/api";

// STATE
let TOKEN = process.env.FIREBASE_TOKEN;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise(resolve => rl.question(query, resolve));

// UTILS
function copyToClipboard(text) {
    if (process.platform === 'darwin') {
        const proc = spawn('pbcopy');
        proc.stdin.write(text);
        proc.stdin.end();
        console.log("📋 (Copied to clipboard)");
    }
}

async function main() {
    // Handle CLI Arguments
    const args = process.argv.slice(2);
    const command = args[0];
    const param = args[1];

    if (!TOKEN) {
        // If not running interactively or if basic auth needed
        // We still might need to ask, but for CLI args usage, we might fail if not present.
        // Let's try to get it if interactive, else warn.
        if (!command) { // Interactive
            console.log("❌ No FIREBASE_TOKEN found in .env or environment.");
            TOKEN = await ask("Enter your Firebase ID Token: ");
        } else {
            console.error("❌ FIREBASE_TOKEN is bad or missing from .env.");
            process.exit(1);
        }
    }

    if (!TOKEN || !TOKEN.trim()) {
        console.error("Token required.");
        process.exit(1);
    }

    // DIRECT COMMAND MODE
    if (command) {
        try {
            switch (command) {
                case 'list':
                case 'ls':
                    await listKeys();
                    break;
                case 'create':
                case 'new':
                    await createKey(param); // param is optional name
                    break;
                case 'revoke':
                case 'rm':
                    await revokeKey(param); // param is keyId
                    break;
                case 'help':
                    printHelp();
                    break;
                default:
                    console.log(`Unknown command: ${command}`);
                    printHelp();
            }
        } catch (err) {
            console.error("❌ Error:", err.message);
            process.exit(1);
        }
        rl.close();
        return;
    }

    // INTERACTIVE MODE
    console.log("🔑 OpenClaw API Key Manager");
    console.log("---------------------------");

    while (true) {
        console.log("\nOptions:");
        console.log("1. List API Keys");
        console.log("2. Create New API Key");
        console.log("3. Revoke API Key");
        console.log("4. Exit");

        const choice = await ask("\nChoice [1-4]: ");

        try {
            switch (choice.trim()) {
                case '1': await listKeys(); break;
                case '2': await createKey(); break;
                case '3': await revokeKey(); break;
                case '4':
                    console.log("Bye!");
                    rl.close();
                    return;
                default:
                    console.log("Invalid choice.");
            }
        } catch (err) {
            console.error("❌ Error:", err.message);
        }
    }
}

function printHelp() {
    console.log(`
Usage:
  npm run keys [command] [args]

Commands:
  list             List all active keys
  create [name]    Create a new key (interactive if name missing)
  revoke [id]      Revoke a key (interactive if id missing)
`);
}

// --- API FUNCTIONS ---

async function callApi(payload) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ data: payload })
    });

    const data = await response.json();

    if (!response.ok) {
        // Firebase Functions error structure
        const msg = data.error ? data.error.message : response.statusText;
        throw new Error(`API Error (${response.status}): ${msg}`);
    }

    return data.result;
}

async function listKeys() {
    console.log("Fetching keys...");
    const result = await callApi({ action: 'listApiKeys' });

    if (!result.keys || result.keys.length === 0) {
        console.log("No active keys found.");
        return;
    }

    console.log("\nYour Active API Keys:");
    console.table(result.keys.map(k => ({
        ID: k.id,
        Name: k.name,
        LastChars: k.lastChars,
        Created: new Date(k.createdAt).toLocaleDateString()
    })));
}

async function createKey(providedName) {
    let name = providedName;
    if (!name) {
        name = await ask("Enter a name for this key (e.g. 'Production Bot'): ");
    }

    if (!name) return console.log("Aborted.");

    console.log(`Creating key '${name}'...`);
    const result = await callApi({
        action: 'createApiKey',
        name: name
    });

    if (result.success) {
        console.log("\n✅ SUCCESS! API KEY CREATED");
        console.log("------------------------------------------------");
        console.log("NAME: " + result.meta.name);
        console.log("KEY : " + result.key);
        copyToClipboard(result.key);
        console.log("------------------------------------------------");
        console.log("⚠️  SAVE THIS KEY NOW. IT WILL NOT BE SHOWN AGAIN.");
    }
}

async function revokeKey(providedId) {
    let keyId = providedId;
    if (!keyId) {
        keyId = await ask("Enter the Key ID to revoke (sk_live_...): ");
    }

    if (!keyId) return console.log("Aborted.");

    // Confirmation (skip if CLI arg provided? maybe safer to always confirm, but for scripts we might want force)
    // For now, let's just confirm if interactive, or if strictly needed. 
    // If provided via CLI, we assume intent. But typically `npm run keys revoke X` implies intent. 
    // Let's print a warning but proceed for CLI to be scriptable, OR keep it safe. 
    // Let's ask for confirmation ALWAYS unless we add a --force flag (not implemented).
    // Actually, asking via `ask` might hang if piped. 
    // Since this is a "DX improvement" task, let's keep it safe.

    if (!process.argv[2]) { // If interactive mode
        const confirm = await ask(`Are you sure you want to revoke ${keyId}? (y/N): `);
        if (confirm.toLowerCase() !== 'y') {
            console.log("Cancelled.");
            return;
        }
    } else {
        console.log(`Revoking ${keyId}...`);
    }

    const result = await callApi({
        action: 'revokeApiKey',
        keyId: keyId
    });

    if (result.success) {
        console.log(`✅ Key ${keyId} revoked successfully.`);
    }
}

main();
