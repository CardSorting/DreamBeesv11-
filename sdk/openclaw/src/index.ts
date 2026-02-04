
import Pusher from 'pusher-js';
import fetch from 'node-fetch';

export interface AgentConfig {
    name: string;
    bio?: string;
    imageUrl?: string;
    voice_dna?: string;
    streamTitle?: string;
    socialLinks?: Record<string, string>;
}

export interface GenerationRequest {
    prompt: string;
    modelId?: string;
    action: 'update_avatar';
}

export interface DreamBeesOptions {
    authToken?: string;
    apiKey?: string;
    apiUrl?: string;
    soketiHost?: string;
    soketiPort?: number;
    soketiKey?: string;
}

export class OpenClawClient {
    private authToken?: string;
    private apiKey?: string;
    private apiUrl: string;
    private soketiHost: string;
    private soketiPort: number;
    private soketiKey: string;

    private pusher: Pusher | null = null;
    private channel: any = null;
    public personaId: string | null = null;

    // Callback for when a message is received
    public onMessage: ((text: string) => Promise<string | void> | string | void) | null = null;

    constructor(options: DreamBeesOptions) {
        if (!options.authToken && !options.apiKey) {
            throw new Error("Must provide either 'authToken' or 'apiKey'");
        }
        this.authToken = options.authToken;
        this.apiKey = options.apiKey;
        this.apiUrl = options.apiUrl || "https://us-central1-dreambees-alchemist.cloudfunctions.net/api";
        this.soketiHost = options.soketiHost || "soketi.dreambees.app";
        this.soketiPort = options.soketiPort || 443;
        this.soketiKey = options.soketiKey || 'app-key'; // Default key
    }

    /**
     * Register the agent with DreamBees to get a personaId and go live.
     * @param config The agent's profile configuration
     */
    async register(config: AgentConfig): Promise<string> {
        console.log("📡 Registering Agent...");
        try {
            const response = await this.callApi('registerAgent', config);

            if (!response || !response.personaId) {
                throw new Error(`Registration failed. Response: ${JSON.stringify(response)}`);
            }

            this.personaId = response.personaId;
            console.log(`✅ Agent Online! Persona ID: ${this.personaId}`);
            console.log(`🔗 Channel: https://dreambees.app/channel/${this.personaId}`);

            return this.personaId!;
        } catch (e) {
            console.error("❌ Registration Error:", e);
            throw e;
        }
    }

    /**
     * Connect to the realtime stream to listen for chat messages.
     */
    async listen() {
        if (!this.personaId) {
            throw new Error("Cannot listen before registering. Call register() first.");
        }

        this.pusher = new Pusher(this.soketiKey, {
            wsHost: this.soketiHost,
            wsPort: this.soketiPort,
            forceTLS: this.soketiPort === 443,
            disableStats: true,
            cluster: 'mt1',
            enabledTransports: ['ws', 'wss']
        });

        const channelName = `presence-chat-${this.personaId}`;
        this.channel = this.pusher.subscribe(channelName);

        console.log(`👂 Listening on channel: ${channelName}`);

        this.channel.bind('new-message', async (data: any) => {
            // Only respond to user messages, ignore self/system
            if (data.role === 'user' && this.onMessage) {
                console.log(`[User]: ${data.text}`);
                try {
                    const reply = await this.onMessage(data.text);
                    if (reply && typeof reply === 'string') {
                        await this.speak(reply);
                    }
                } catch (e) {
                    console.error("Error processing message:", e);
                }
            }
        });

        // Handle connection errors
        this.pusher.connection.bind('error', (err: any) => {
            console.error("Soketi Connection Error:", err);
        });
    }

    /**
     * Send a reply to the stream (Text + TTS + Animation).
     * @param text The text to speak
     * @param emotion Optional emotion override
     * @param action Optional animation action
     */
    async speak(text: string, emotion: string = 'neutral', action?: string) {
        if (!this.personaId) return;

        console.log(`[Agent]: ${text}`);
        await this.callApi('agentReply', {
            personaId: this.personaId,
            text,
            emotion,
            action
        });
    }

    /**
     * Request a new avatar generation.
     * @param request Generation parameters
     */
    async generateAvatar(request: GenerationRequest) {
        if (!this.personaId) return;

        console.log(`🎨 Generating Avatar: ${request.prompt}`);
        await this.callApi('createGenerationRequest', {
            targetPersonaId: this.personaId,
            ...request
        });
    }

    private async callApi(action: string, data: any) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        } else if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ data: { action, ...data } })
        });

        const result: any = await response.json();
        return result.result || result;
    }
}
