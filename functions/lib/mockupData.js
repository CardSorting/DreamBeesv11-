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

export const TCG_PRESETS = [
    {
        id: 'gaming_mat',
        label: 'Gaming Mat',
        prompt: 'Place the {subject} flat on a neoprene trading card game playmat. Soft studio lighting, faint hexagonal pattern on the mat.',
        category: 'Gaming'
    },
    {
        id: 'velvet_cloth',
        label: 'Velvet Cloth',
        prompt: 'Place the {subject} on a rich, dark purple velvet fortune telling cloth. Dramatic spotlighting, mystical atmosphere.',
        category: 'Gaming'
    },
    {
        id: 'poker_table',
        label: 'Poker Table',
        prompt: 'Place the {subject} on a green felt casino poker table. Dim ambient lighting, shallow depth of field.',
        category: 'Gaming'
    },
    {
        id: 'collector_slab',
        label: 'Graded Slab',
        prompt: 'The {subject} is encased in a professional PSA-style acrylic grading slab, standing upright on a white surface. Studio lighting reflecting off the plastic case.',
        category: 'Gaming'
    },
    // Reuse some good general ones
    ...MOCKUP_PRESETS.filter(p => ['wood', 'marble', 'industrial', 'akiba_night'].includes(p.id))
];

export const TCG_ITEMS = [
    {
        id: 'tcg_pokemon',
        label: 'Poke-Style Holo',
        formatSpec: 'holographic collectible trading card inspired by Pokemon TCG aesthetics. The design is the main monster art. Yellow borders, HP text, energy symbols subtly integrated.',
        subjectNoun: 'trading card',
        category: 'TCG'
    },
    {
        id: 'tcg_magic',
        label: 'Fantasy TCG',
        formatSpec: 'vintage fantasy trading card inspired by Magic: The Gathering aesthetics. The design is the card art. Parchment texture borders, mana symbols, painted style.',
        subjectNoun: 'trading card',
        category: 'TCG'
    },
    {
        id: 'tcg_yugioh',
        label: 'Duel Monster',
        formatSpec: 'anime trading card inspired by Yu-Gi-Oh aesthetics. The design is the monster image. Orange/brown frame, attack/defense stars, detailed tech-magic borders.',
        subjectNoun: 'trading card',
        category: 'TCG'
    },
    {
        id: 'tcg_sports',
        label: 'Sports Chrome',
        formatSpec: 'modern chromium sports trading card. High gloss refractor finish, futuristic angular graphics overlay, autograph area at bottom.',
        subjectNoun: 'sports card',
        category: 'TCG'
    },
    {
        id: 'tcg_fullart',
        label: 'Full Art Holo',
        formatSpec: 'borderless full-art collector\'s card. Etched holographic texture over the entire surface. The design extends to the very edges.',
        subjectNoun: 'collectible card',
        category: 'TCG'
    },
    {
        id: 'tcg_vintage',
        label: 'Vintage Tobacco',
        formatSpec: '1900s era tobacco trading card. Thick matte cardboard, muted colors, and distressed edges. Old-school typography.',
        subjectNoun: 'vintage card',
        category: 'TCG'
    },
    {
        id: 'tcg_cyberpunk',
        label: 'Netrunner ID',
        formatSpec: 'futuristic transparent data-card. Glowing neon circuitry traces, semi-opaque plastic material, cyberpunk interface elements.',
        subjectNoun: 'data card',
        category: 'TCG'
    },
    {
        id: 'tcg_gold',
        label: 'Solid Gold 1/1',
        formatSpec: 'luxurious 24k gold-plated metal card. Laser engraved details, heavy metallic shine/reflections. Serial number "1 of 1" stamped.',
        subjectNoun: 'metal card',
        category: 'TCG'
    },
    {
        id: 'tcg_pixel',
        label: '8-Bit Retro',
        formatSpec: 'retro video game trading card. Pixelated design aesthetic, scanline filter effect, 90s arcade vibe.',
        subjectNoun: 'game card',
        category: 'TCG'
    },
    {
        id: 'tcg_dark_fantasy',
        label: 'Grim Grimoire',
        formatSpec: 'dark gothic fantasy card. Distressed leather-like border texture, silver foil runes, eldritch horror aesthetic.',
        subjectNoun: 'gothic card',
        category: 'TCG'
    },
    {
        id: 'tcg_shattered',
        label: 'Shattered Glass',
        formatSpec: 'trading card with a "shattered glass" or "cracked ice" holographic pattern overlay. Prismatic reflections fracturing the light.',
        subjectNoun: 'holographic card',
        category: 'TCG'
    },
    {
        id: 'tcg_relic',
        label: 'Relic Insert',
        formatSpec: 'premium thick trading card containing an embedded piece of fabric material (relic) in a window. Fancy bordered cutout.',
        subjectNoun: 'relic card',
        category: 'TCG'
    },
    {
        id: 'tcg_graded',
        label: 'Graded Gem Mint',
        formatSpec: 'collectible card encased in a hard plastic grading slab with a "GEM MINT 10" label at the top. Ultrasonic weld seams.',
        subjectNoun: 'graded card',
        category: 'TCG'
    },
    {
        id: 'tcg_acetate',
        label: 'Clear Acetate',
        formatSpec: 'see-through clear plastic acetate trading card. The design is printed on transparent plastic with opaque backing only behind the subject.',
        subjectNoun: 'clear card',
        category: 'TCG'
    },
    {
        id: 'tcg_sketch',
        label: 'Artist Sketch',
        formatSpec: 'rare "1 of 1" artist sketch card. Hand-drawn graphite and marker aesthetic on thick card stock. Rough, authentic art style.',
        subjectNoun: 'sketch card',
        category: 'TCG'
    },
    {
        id: 'tcg_lenticular',
        label: 'Lenticular 3D',
        formatSpec: 'ridged plastic lenticular motion card. The image appears to shift and move. Grooved surface texture.',
        subjectNoun: '3D card',
        category: 'TCG'
    },
    {
        id: 'tcg_hanafuda',
        label: 'Flower Card',
        formatSpec: 'traditional Japanese Hanafuda card. Small, thick stiff backing, bold flat colors, nature motifs, distinct black border.',
        subjectNoun: 'hanafuda card',
        category: 'TCG'
    },
    {
        id: 'tcg_tarot',
        label: 'Tarot Card',
        formatSpec: 'tall mystical Tarot card. Gold foil ornate Art Nouveau borders. The design is the central figure. worn paper texture.',
        subjectNoun: 'tarot card',
        category: 'TCG'
    }
];

export const DOLL_ITEMS = [
    {
        id: 'doll_mold_1',
        label: 'Basic Mold A',
        moldPath: 'doll1.png', // Relative to functions/assets/dolls/
        subjectNoun: 'vinyl toy figure',
        category: 'Doll'
    },
    {
        id: 'doll_mold_2',
        label: 'Basic Mold B',
        moldPath: 'doll2.png',
        subjectNoun: 'vinyl toy figure',
        category: 'Doll'
    },
    {
        id: 'doll_mold_3',
        label: 'Basic Mold C',
        moldPath: 'doll3.jpg',
        subjectNoun: 'vinyl toy figure',
        category: 'Doll'
    }
];

export const DOLL_PRESETS = [
    {
        id: 'doll_studio',
        label: 'Studio Finish',
        prompt: 'A high-quality studio mockup of the painted vinyl toy, neutral background, soft product lighting, looks like a real blind-box collectible.',
        category: 'DollStudio'
    }
];

