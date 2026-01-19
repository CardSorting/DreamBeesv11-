// Consolidated Mockup Data for Backend Gacha

export const MOCKUP_PRESETS = [
    {
        id: 'studio',
        label: 'Clean Studio',
        prompt: 'Place the {subject} on a seamless white background. Soft, diffuse studio lighting from the left. Minimalist and clean aesthetic.',
        category: 'Studio'
    },
    {
        id: 'marble',
        label: 'Luxury Marble',
        prompt: 'Place the {subject} on a polished white Carrara marble surface. Elegant high-key lighting with sharp reflections.',
        category: 'Studio'
    },
    {
        id: 'shadow_play',
        label: 'Dynamic Shadows',
        prompt: 'Place the {subject} on a textured beige plaster surface. Strong, dynamic shadows cast by tropical palm leaves creating a bold geometric pattern across the composition. High-fashion, artistic, and unique lighting.',
        category: 'Studio'
    },
    {
        id: 'otaku_room',
        label: 'The Shrine',
        prompt: 'Place the {subject} in the center of a cluttered, cozy otaku bedroom desk. Surrounded by other anime figurines, manga volumes, and warm string fairy lights. Bokeh background of glowing PC monitors and posters. Intimate and authentic fan atmosphere.',
        category: 'Lifestyle'
    },
    {
        id: 'school_desk',
        label: 'Classroom',
        prompt: 'Place the {subject} on a weathered wooden Japanese high school student desk. Intense golden hour sunlight filters through a nearby window, casting long, warm shadows. A blue school bag is leaning against the desk leg in the blurred background. Nostalgic "slice of life" anime aesthetic.',
        category: 'Lifestyle'
    },
    {
        id: 'akiba_night',
        label: 'Akiba Night',
        prompt: 'Place the {subject} on a dark, wet urban pavement in Akihabara at night. Vibrant neon signs in Japanese kanji are reflected in the puddles. High contrast, cinematic cyberpunk lighting with pink and cyan color grading.',
        category: 'Urban'
    },
    {
        id: 'wood',
        label: 'Wood Table',
        prompt: 'Place the {subject} flat on a warm, textured oak wooden table. Natural sunlight coming from a window, casting organic shadows.',
        category: 'Lifestyle'
    },
    {
        id: 'cafe',
        label: 'Cafe Vibe',
        prompt: 'Place the {subject} on a wooden cafe table next to a steaming latte. Warm, cozy coffee shop lighting with a blurred background of the shop interior.',
        category: 'Lifestyle'
    },
    {
        id: 'plants',
        label: 'Botanical',
        prompt: 'Place the {subject} amongst fresh green house plants. Soft, organic feel with dappled sunlight filtering through leaves.',
        category: 'Nature'
    },
    {
        id: 'beach',
        label: 'Beach Scene',
        prompt: 'Place the {subject} on golden sand at the beach. Bright natural sunlight, with a blurred turquoise ocean and blue sky in the background. Summer vacation atmosphere.',
        category: 'Nature'
    },
    {
        id: 'industrial',
        label: 'Industrial',
        prompt: 'Place the {subject} on a raw grey concrete surface. Moody, dramatic lighting with cool tones.',
        category: 'Urban'
    },
    {
        id: 'street',
        label: 'Urban Street',
        prompt: 'Place the {subject} on a weathered concrete ledge in a city environment. Natural daylight with urban architecture blurred in the background. Street style aesthetic.',
        category: 'Urban'
    },
    {
        id: 'retro',
        label: 'Retro Polaroid',
        prompt: 'Transform the presentation of the {subject} to look like a vintage snapshot on a distressed wooden surface. Warm film grain, slight vignette, and a nostalgic analog aesthetic.',
        category: 'Vintage'
    }
];

export const MOCKUP_ITEMS = [
    // Apparel
    {
        id: 'tshirt_screenprint',
        label: 'Standard T-Shirt',
        formatSpec: 'heavyweight cotton crew neck t-shirt featuring the design as a high-quality screen print ink application',
        subjectNoun: 't-shirt',
        category: 'Apparel'
    },
    {
        id: 'tshirt_vintage',
        label: 'Vintage Tee',
        formatSpec: 'washed black oversized vintage t-shirt featuring the design as a distressed, cracked plastisol screen print',
        subjectNoun: 'vintage t-shirt',
        category: 'Apparel'
    },
    {
        id: 'hoodie_puff',
        label: 'Puff Print Hoodie',
        formatSpec: 'fleece pullover hoodie featuring the design as a raised 3D puff screen print',
        subjectNoun: 'puff print hoodie',
        category: 'Apparel'
    },
    {
        id: 'jacket_denim',
        label: 'Denim Jacket',
        formatSpec: 'classic blue denim trucker jacket featuring the design painted on the back panel',
        subjectNoun: 'denim jacket',
        category: 'Apparel'
    },
    {
        id: 'beanie_embroidered',
        label: 'Beanie',
        formatSpec: 'knit cuff beanie cap featuring the design as high-quality 3D raised embroidery',
        subjectNoun: 'beanie cap',
        category: 'Apparel'
    },
    {
        id: 'baseball_cap',
        label: 'Dad Hat',
        formatSpec: 'washed cotton twill "dad hat" baseball cap featuring the design as direct embroidery',
        subjectNoun: 'baseball cap',
        category: 'Apparel'
    },
    // Packaging
    {
        id: 'standup_pouch',
        label: 'Stand-up Pouch',
        formatSpec: 'matte stand-up resealable packaging pouch',
        subjectNoun: 'packaging pouch',
        category: 'Packaging'
    },
    {
        id: 'coffee_bag',
        label: 'Coffee Bag',
        formatSpec: 'craft paper coffee bean bag with valve',
        subjectNoun: 'coffee bag',
        category: 'Packaging'
    },
    {
        id: 'shipping_box',
        label: 'Shipping Box',
        formatSpec: 'corrugated cardboard delivery shipping box',
        subjectNoun: 'shipping box',
        category: 'Packaging'
    },
    {
        id: 'soda_can',
        label: 'Soda Can',
        formatSpec: 'aluminum beverage can with condensation drops',
        subjectNoun: 'beverage can',
        category: 'Packaging'
    },
    {
        id: 'cosmetic_tube',
        label: 'Cosmetic Tube',
        formatSpec: 'soft plastic cosmetic squeeze tube',
        subjectNoun: 'cosmetic tube',
        category: 'Packaging'
    },
    {
        id: 'shopping_bag',
        label: 'Shopping Bag',
        formatSpec: 'paper retail shopping bag with handles',
        subjectNoun: 'shopping bag',
        category: 'Packaging'
    },
    // Print
    {
        id: 'print_4x6',
        label: '4x6 Print',
        formatSpec: '4x6 inch photo print',
        subjectNoun: 'photo print',
        category: 'Print'
    },
    {
        id: 'magazine',
        label: 'Magazine',
        formatSpec: 'glossy fashion magazine cover',
        subjectNoun: 'magazine',
        category: 'Print'
    },
    {
        id: 'poster',
        label: 'Poster',
        formatSpec: 'large vertical wall poster',
        subjectNoun: 'wall poster',
        category: 'Print'
    },
    {
        id: 'sticker_diecut',
        label: 'Die-Cut Sticker',
        formatSpec: 'die-cut vinyl sticker with white border contour',
        subjectNoun: 'sticker',
        category: 'Print'
    },
    {
        id: 'notebook',
        label: 'Notebook',
        formatSpec: 'spiral bound notebook',
        subjectNoun: 'notebook',
        category: 'Print'
    },
    {
        id: 'business_cards',
        label: 'Business Cards',
        formatSpec: 'stack of professional business cards',
        subjectNoun: 'business cards',
        category: 'Print'
    },
    // Other / Random
    {
        id: 'mug_ceramic',
        label: 'Ceramic Mug',
        formatSpec: 'classic white ceramic coffee mug',
        subjectNoun: 'coffee mug',
        category: 'Home'
    },
    {
        id: 'tote_bag',
        label: 'Tote Bag',
        formatSpec: 'natural canvas tote bag',
        subjectNoun: 'tote bag',
        category: 'Accessories'
    },
    {
        id: 'pillow',
        label: 'Throw Pillow',
        formatSpec: 'square decorative throw pillow',
        subjectNoun: 'throw pillow',
        category: 'Home'
    },
    {
        id: 'phone_case',
        label: 'Phone Case',
        formatSpec: 'hard plastic smartphone case',
        subjectNoun: 'phone case',
        category: 'Electronics'
    },
    {
        id: 'vinyl_record',
        label: 'Vinyl Record',
        formatSpec: '12-inch vinyl record with paper sleeve',
        subjectNoun: 'vinyl record',
        category: 'Media'
    },
    {
        id: 'skateboard',
        label: 'Skateboard Deck',
        formatSpec: 'wooden skateboard deck bottom',
        subjectNoun: 'skateboard deck',
        category: 'Sports'
    }
];

