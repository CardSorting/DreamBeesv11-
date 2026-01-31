export const PRESET_CATEGORIES = [
    {
        id: 'style',
        label: 'Style',
        presets: [
            { text: "Cyberpunk style", icon: "🤖", description: "Futuristic neon aesthetic" },
            { text: "Ghibli style", icon: "🍃", description: "Studio Ghibli animation style" },
            { text: "Oil painting", icon: "🎨", description: "Classic oil painting texture" },
            { text: "Noir detective", icon: "🕵️", description: "Black & white film noir" },
            { text: "Anime style", icon: "✨", description: "Japanese anime aesthetic" },
            { text: "Pixel art", icon: "👾", description: "Retro pixelated style" }
        ]
    },
    {
        id: 'lighting',
        label: 'Lighting',
        presets: [
            { text: "Sunset lighting", icon: "🌇", description: "Warm golden hour glow" },
            { text: "Dramatic lighting", icon: "🎭", description: "High contrast shadows" },
            { text: "Neon lights", icon: "💡", description: "Vibrant neon glow" },
            { text: "Soft natural light", icon: "🌤️", description: "Gentle daylight" },
            { text: "Cinematic lighting", icon: "🎬", description: "Movie-style lighting" },
            { text: "Volumetric fog", icon: "🌫️", description: "Atmospheric depth" }
        ]
    },
    {
        id: 'mood',
        label: 'Mood',
        presets: [
            { text: "Make it snowy", icon: "❄️", description: "Winter wonderland scene" },
            { text: "Rainy atmosphere", icon: "🌧️", description: "Wet rainy mood" },
            { text: "Dreamy ethereal", icon: "☁️", description: "Soft dreamy quality" },
            { text: "Dark ominous", icon: "🌑", description: "Mysterious and dark" },
            { text: "Joyful vibrant", icon: "🌈", description: "Bright and cheerful" },
            { text: "Melancholic", icon: "🍂", description: "Somber autumn mood" }
        ]
    },
    {
        id: 'transform',
        label: 'Transform',
        presets: [
            { text: "Add glowing eyes", icon: "👁️", description: "Intense glowing eyes" },
            { text: "Make them smile", icon: "😊", description: "Happy expression" },
            { text: "Add accessories", icon: "🎀", description: "Jewelry or accessories" },
            { text: "Change hair color", icon: "💇", description: "Different hair color" },
            { text: "Add background", icon: "🏞️", description: "Detailed environment" },
            { text: "Make it detailed", icon: "🔍", description: "Enhanced details" }
        ]
    }
];

// Flattened presets for backward compatibility
export const PRESETS = PRESET_CATEGORIES.flatMap(cat => cat.presets);