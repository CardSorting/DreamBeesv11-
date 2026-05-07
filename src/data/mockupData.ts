/**
 * [LAYER: DATA]
 * Transferred Mockup Definitions from v11
 */

export interface MockupItem {
    id: string;
    label: string;
    description: string;
    category: string;
    icon?: string;
}

export const MOCKUP_ITEMS: MockupItem[] = [
    {
        id: 'apparel-t-shirt',
        label: 'Classic T-Shirt',
        description: 'Standard heavy cotton t-shirt. Clean and versatile.',
        category: 'Apparel'
    },
    {
        id: 'apparel-hoodie',
        label: 'Premium Hoodie',
        description: 'Cozy streetwear staple with realistic fabric texture.',
        category: 'Apparel'
    },
    {
        id: 'apparel-tote-bag',
        label: 'Canvas Tote',
        description: 'Eco-friendly shopping bag. Great for patterns.',
        category: 'Apparel'
    },
    {
        id: 'kitchen-mug',
        label: 'Coffee Mug',
        description: 'Glossy ceramic mug. Perfect for morning brews.',
        category: 'Home & Living'
    },
    {
        id: 'home-pillow',
        label: 'Accent Pillow',
        description: 'Square decorative pillow for cozy interiors.',
        category: 'Home & Living'
    },
    {
        id: 'electronics-phone-case',
        label: 'Phone Case',
        description: 'Hard-shell protection for latest mobile devices.',
        category: 'Tech'
    },
    {
        id: 'electronics-laptop-skin',
        label: 'Laptop Skin',
        description: 'Precision-cut vinyl wrap for sleek hardware.',
        category: 'Tech'
    },
    {
        id: 'anime-poster',
        label: 'Canvas Poster',
        description: 'Vertical museum-quality wall art.',
        category: 'Print'
    },
    {
        id: 'print-sticker',
        label: 'Die-Cut Sticker',
        description: 'Individual vinyl sticker with realistic peeling.',
        category: 'Print'
    },
    {
        id: 'reskin_credit_card',
        label: 'Credit Card',
        description: 'Premium metal card. Reskin with unique designs.',
        category: 'Reskin'
    },
    {
        id: 'reskin_blank_toy',
        label: 'Designer Toy',
        description: 'Limited edition vinyl figure for custom styles.',
        category: 'Reskin'
    },
    {
        id: 'reskin-game-console',
        label: 'Retro Console',
        description: 'Handheld gaming device. Reskin the shell.',
        category: 'Reskin'
    }
];

export const MOCKUP_PRESETS = [
    { id: 'studio', label: 'Clean Studio', description: 'Neutral lighting, soft shadows.' },
    { id: 'marble', label: 'Luxury Marble', description: 'High-end reflections, elegant.' },
    { id: 'shadow_play', label: 'Dynamic Shadows', description: 'Artistic window-blind shadows.' },
    { id: 'otaku_room', label: 'The Shrine', description: 'Warm LEDs, collectibles background.' },
    { id: 'cafe', label: 'Cafe Vibe', description: 'Out-of-focus coffee shop atmosphere.' },
    { id: 'plants', label: 'Botanical', description: 'Natural greens and bright sunlight.' },
    { id: 'beach', label: 'Beach Scene', description: 'Golden hour, sand, and ocean spray.' },
    { id: 'industrial', label: 'Industrial Loft', description: 'Exposed brick, moody lighting.' },
    { id: 'street', label: 'Urban Street', description: 'City backdrop, natural daylight.' },
    { id: 'retro', label: 'Retro Polaroid', description: 'Vintage film grain and light leaks.' }
];
