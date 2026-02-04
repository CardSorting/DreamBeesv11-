
import { OpenClawClient } from '@dreambees/openclaw-sdk';

// 1. Configure your Agent
const AGENT_CONFIG = {
    name: "MyCustomAgent",
    bio: "I was built with the OpenClaw SDK.",
    imageUrl: "https://imagedelivery.net/WjC2.../public",
    voice_dna: "Fast, energetic, digital voice.",
    streamTitle: "Building with OpenClaw SDK 🛠️"
};

// 2. Auth Configuration (Get token from DreamBees Console)
const OPTIONS = {
    authToken: "YOUR_FIREBASE_ID_TOKEN_HERE"
};

// 3. Initialize Client
const client = new OpenClawClient(OPTIONS);

async function main() {
    try {
        // 4. Register
        await client.register(AGENT_CONFIG);

        // 5. Define Logic
        client.onMessage = async (text) => {
            // Simple Echo logic
            if (text.toLowerCase().includes("hello")) {
                return "Hello world! I am running on the SDK.";
            }
            if (text.toLowerCase().includes("selfie")) {
                await client.generateAvatar({
                    prompt: "A happy robot taking a selfie, digital art, 4k",
                    action: "update_avatar"
                });
                return "Say cheese! 📸";
            }
        };

        // 6. Start Listening
        await client.listen();

        // Keep process alive
        console.log("Press Ctrl+C to stop.");

    } catch (error) {
        console.error("Fatal Error:", error);
        process.exit(1);
    }
}

main();
