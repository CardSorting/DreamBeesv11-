class PresetFactory {
    constructor() {
        this.presets = [];
        this.initializeDefaults();
    }

    static getInstance() {
        if (!PresetFactory.instance) {
            PresetFactory.instance = new PresetFactory();
        }
        return PresetFactory.instance;
    }

    initializeDefaults() {
        // STUDIO
        this.registerPreset({
            id: 'studio',
            icon: '📸',
            label: 'Clean Studio',
            description: 'Minimalist white background with soft, professional studio lighting.',
            prompt: 'Place the {subject} on a seamless white background. Soft, diffuse studio lighting from the left. Minimalist and clean aesthetic.',
            category: 'Studio'
        });

        this.registerPreset({
            id: 'marble',
            icon: '✨',
            label: 'Luxury Marble',
            description: 'Elegant white marble with reflections.',
            prompt: 'Place the {subject} on a polished white Carrara marble surface. Elegant high-key lighting with sharp reflections.',
            category: 'Studio'
        });

        this.registerPreset({
            id: 'shadow_play',
            icon: '🌗',
            label: 'Dynamic Shadows',
            description: 'Artistic strong shadows on textured surface.',
            prompt: 'Place the {subject} on a textured beige plaster surface. Strong, dynamic shadows cast by tropical palm leaves creating a bold geometric pattern across the composition. High-fashion, artistic, and unique lighting.',
            category: 'Studio'
        });

        // LIFESTYLE
        this.registerPreset({
            id: 'otaku_room',
            icon: '🏠',
            label: 'The Shrine',
            description: 'A cozy otaku room filled with anime collections and warm lighting.',
            prompt: 'Place the {subject} in the center of a cluttered, cozy otaku bedroom desk. Surrounded by other anime figurines, manga volumes, and warm string fairy lights. Bokeh background of glowing PC monitors and posters. Intimate and authentic fan atmosphere.',
            category: 'Lifestyle'
        });

        this.registerPreset({
            id: 'school_desk',
            icon: '🎒',
            label: 'Classroom',
            description: 'A classic Japanese high school desk in the afternoon sun.',
            prompt: 'Place the {subject} on a weathered wooden Japanese high school student desk. Intense golden hour sunlight filters through a nearby window, casting long, warm shadows. A blue school bag is leaning against the desk leg in the blurred background. Nostalgic "slice of life" anime aesthetic.',
            category: 'Lifestyle'
        });

        this.registerPreset({
            id: 'tatami',
            icon: '🎍',
            label: 'Tatami Room',
            description: 'A traditional Japanese room with straw mats and sliding doors.',
            prompt: 'Place the {subject} on a traditional Japanese tatami straw mat floor. Soft, diffused daylight coming through a translucent shoji paper sliding door. Minimalist Zen aesthetic with a small bonsai plant blurred in the corner.',
            category: 'Lifestyle'
        });

        this.registerPreset({
            id: 'akiba_night',
            icon: '🌃',
            label: 'Akiba Night',
            description: 'Vibrant neon street vibes from Akihabara at night.',
            prompt: 'Place the {subject} on a dark, wet urban pavement in Akihabara at night. Vibrant neon signs in Japanese kanji are reflected in the puddles. High contrast, cinematic cyberpunk lighting with pink and cyan color grading.',
            category: 'Urban'
        });

        this.registerPreset({
            id: 'wood',
            icon: '🪵',
            label: 'Wood Table',
            description: 'Natural oak table with warm sunlight.',
            prompt: 'Place the {subject} flat on a warm, textured oak wooden table. Natural sunlight coming from a window, casting organic shadows.',
            category: 'Lifestyle'
        });

        this.registerPreset({
            id: 'hand',
            icon: '🖐️',
            label: 'POV Hand Held',
            description: 'First-person view held by a hand.',
            prompt: 'A realistic first-person view of a hand holding the {subject} up. Shallow depth of field with a blurred natural background.',
            category: 'Lifestyle'
        });

        this.registerPreset({
            id: 'cafe',
            icon: '☕',
            label: 'Cafe Vibe',
            description: 'Warm cafe setting with ambient lighting.',
            prompt: 'Place the {subject} on a wooden cafe table next to a steaming latte. Warm, cozy coffee shop lighting with a blurred background of the shop interior.',
            category: 'Lifestyle'
        });

        // NATURE
        this.registerPreset({
            id: 'plants',
            icon: '🌿',
            label: 'Botanical',
            description: 'Surrounded by fresh plants and nature.',
            prompt: 'Place the {subject} amongst fresh green house plants. Soft, organic feel with dappled sunlight filtering through leaves.',
            category: 'Nature'
        });

        this.registerPreset({
            id: 'beach',
            icon: '🏖️',
            label: 'Beach Scene',
            description: 'Sunny sandy beach with ocean vibes.',
            prompt: 'Place the {subject} on golden sand at the beach. Bright natural sunlight, with a blurred turquoise ocean and blue sky in the background. Summer vacation atmosphere.',
            category: 'Nature'
        });

        // URBAN
        this.registerPreset({
            id: 'industrial',
            icon: '🧱',
            label: 'Industrial',
            description: 'Concrete surface with moody lighting.',
            prompt: 'Place the {subject} on a raw grey concrete surface. Moody, dramatic lighting with cool tones.',
            category: 'Urban'
        });

        this.registerPreset({
            id: 'street',
            icon: '🏙️',
            label: 'Urban Street',
            description: 'City aesthetic on concrete textures.',
            prompt: 'Place the {subject} on a weathered concrete ledge in a city environment. Natural daylight with urban architecture blurred in the background. Street style aesthetic.',
            category: 'Urban'
        });

        // VINTAGE
        this.registerPreset({
            id: 'retro',
            icon: '🎞️',
            label: 'Retro Polaroid',
            description: 'Vintage aesthetic with film grain.',
            prompt: 'Transform the presentation of the {subject} to look like a vintage snapshot on a distressed wooden surface. Warm film grain, slight vignette, and a nostalgic analog aesthetic.',
            category: 'Vintage'
        });
    }

    registerPreset(preset) {
        if (!this.presets.find(p => p.id === preset.id)) {
            this.presets.push(preset);
        }
    }

    getPresets() {
        return [...this.presets];
    }

    getPresetById(id) {
        return this.presets.find(p => p.id === id);
    }
}

export const presetFactory = PresetFactory.getInstance();
