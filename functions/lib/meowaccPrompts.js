
export const MEOWACC_PROMPT = `
Reimagine this scene through the MEOWACC lens: A world where everything is softer, cuter, and filled with cats.

**THE CORE TASK: SUMMON THE CATS**
-   **Cat Presence:** The subject is no longer alone. They must be accompanied by several cute, fluffy, stylized cats.
-   **Interaction:** These cats should be interacting with the subject and the environment.
-   **Cat Style:** The cats should be round, soft, and expressive (like high-quality anime or mascot characters). Use white, cream, or pastel fur colors.

**THE AESTHETIC (MEOWACC):**
-   **Mood:** Joyous, lightly mischievous, and overwhelmingly cute.
-   **Lighting:** Soft, warm, "Golden Hour" pastel lighting. No harsh shadows.
-   **Colors:** Infuse the scene with the signature MEOWACC palette: Millennial Pink, Baby Blue, Soft Lavender, and Cream.

**THE SUBJECT:**
-   Keep the subject recognizable and central.
-   Enhance their expression to be happy and relaxed, reacting to the presence of the cats.
-   Softly stylize their appearance to match the dreamy, illustrative quality of the world.

**Output:** A heartwarming, high-quality digital illustration where the subject is enjoying the company of adorable magical cats in a soft, pastel dreamscape.
`;

export const MEOWACC_CARD_PROMPT = `
Create a "MEOWACC Parody Trading Card" based on the attached image.
**Task:** Redraw the subject in the Kawaii-Tech Y2K style and frame it inside a collectible trading card interface.

**Visual Style (The Card):**
-   **Frame:** Chunky, glossy, pastel borders (Pink, Lavender, or Mint).
-   **Holographic Effect:** Prismatic rainbow gradients in the background.
-   **Layout:** Name Banner, stylized illustration, and a text box with funny RPG stats and a special move description.

**Subject Stylization:**
- Soft, bubbly, high-quality digital illustration.
- Add cat ears or whiskers if it fits the "cute" vibe.

**Output:** The final image should be the flat 2D graphic of the card itself, filling the frame.
`;

export const MEOWACC_SPORTS_PROMPT = `
Create a "MEOWACC Sports Chrome Trading Card" based on the attached image.
A high-end, limited edition "Refractor" sports card that blends intense athletic energy with the glossy, pastel MEOWACC aesthetic.

**Visual Style:**
- Metallic foil texture with gradients of silver and holographic blue.
- Thick, dynamic vector lines and "shatter" effects for motion.
- Modern, angular tech-frame border with team logos and stats.

**Output:** A vertical, glossy, high-energy trading card that looks expensive and collectible.
`;

export const MEOWACC_SPORTS_PRO_PROMPT = `
Sports poster / trading card artwork in MEOWACC style.
The athlete MUST overlap and break the decorative frame. The frame sits BEHIND the athlete.

Visual style: MEOWACC aesthetic — pastel-neon glow, soft candy-like highlights, playful star motifs.
Design: Ornamental card frame behind the athlete, futuristic tech lines, floating stars.
Lighting: Cinematic sports lighting, soft bloom, polished poster look.
`;

export const MEOWACC_FIFA_PROMPT = `
Create an "Ultra-premium football trading card" in the MEOWACC style.
Centered athlete portrait, waist-up, in an ornate card frame with crystalline geometry.

Visual Style: Soft pastel palette, crystalline textures that feel plush and glossy.
Typography: Authoritative and clean with metallic gold accents.
UI: Large rating number and a stat grid (PAC, SHO, PAS, etc.).
Overall Tone: Elite, collectible, calm, and comforting.
`;

export const MEOWACC_POSTER_PROMPT = `
Create a "Stadium Superstar" Tribute Poster in the MEOWACC Style.
Capture "The Big Win" in a futuristic pastel arena with confetti raining down.

Atmosphere: Dreamy stadium with translucent arches and God Rays.
Crowd: Sea of out-of-focus light sticks/bokeh dots.
Dynamic Elements: Confetti rain, low-hanging fog, and subtle speed lines.
Typography: Massive, blocky, metallic 3D letters ("CHAMPION", "MVP", etc.).
`;

export const MEOWACC_ENSEMBLE_PROMPT = `
Create a "Hero Ensemble Poster" in the MEOWACC Style.
A "movie poster" montage where the SINGLE subject is cloned and arranged into a power pyramid.

Composition: One large dominant subject centered, surrounded by 4-6 smaller versions in different hallucinated poses.
Aesthetic: Pastel Y2K colors, dreamy bloom, hearts, stars, and cat accents.
Typography: Bold celebratory text near the bottom.
`;

export const MEOWACC_COMIC_PROMPT = `
Create a "Mixed Media Comic Strip" in the MEOWACC Style.
A comic page featuring a unique blend of 3D High-Gloss Rendering (Main Hero) and 2D Flat Manga Lines (Action Panels).

Layout: 3 to 5 panels with white gutters.
Onomatopoeia: Cute text bubbles like "MEOW!", "ZAP!", or "✨SPARKLE✨".
Story: Subject interacting with "Cute Energy" (fighting grumpy clouds, chasing stars).
`;

export const MEOWACC_TAROT_PROMPT = (cardName) => `
Create a "Mystic MEOWACC Tarot Card" based on the attached image.
**The Card: ${cardName.toUpperCase()}**

Identity: Preserve the subject's face, features, and pose near-identically.
Tarot Archetype: Dress the subject in "MEOWACC" versions of the card's attire.
Iconic Symbols: Iridescent star-scepters, glowing crystal blades, and divine rings.
Visual Style: Porcelain-smooth skin, high-gloss hair, and rose gold foil borders.
`;

export const generatePokerPrompt = (card) => {
    const suitConfigs = {
        'Hearts': { vibe: 'Warm, Loving, Pink & Red Pastels', decor: 'Floating hearts, soft clouds' },
        'Diamonds': { vibe: 'Luxurious, Sparkly, Icy Blue & White', decor: 'Sparkles, diamond shapes' },
        'Clubs': { vibe: 'Playful, Natural, Mint Green & Cream', decor: 'Clovers, bubbles' },
        'Spades': { vibe: 'Cool, Edgy, Lavender & Purple', decor: 'Stars, crescent moons' }
    };
    const config = suitConfigs[card.suit];
    let overlay = "";

    if (card.rank === 'A') {
        overlay = "ACE SPECIAL: Giant, glowing, glossy 3D symbol in the background.";
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
        overlay = `ROYALTY: Subtly integrate royal motifs (floating crown or semi-transparent cape).`;
    } else {
        overlay = `NUMBER CARD: Surround the subject with exactly ${card.rank} floating symbols.`;
    }

    return `
    **TASK:** Create a Poker Playing Card: **${card.rank} of ${card.suit}**.
    
    Identity Preservation: Preserve the subject's face and pose near-identically. No anatomical changes (no literal cat ears).
    Vibe: ${config.vibe}. Decor: ${config.decor}.
    ${overlay}
    
    Format: Vertical Poker Card layout with Indices in elegant designer font.
    Art Style: High-gloss, 3D-vector hybrid with "Dreamy Bloom" and strong rim lighting.
  `;
};

export const MEOWACC_MEOWD_PROMPT = `
Create a vision of "Avant-Garde Typographic Surrealism" in the MEOWACC Style.
In this world, matter is built from the 4-letter word "MEOW".

Visual Rules: Walls built of stacked 'M' bricks, hair as flowing 'e' loops.
Atmosphere: Zero-gravity floating letters, typographic bokeh, and glowing "Pro-Mist" effects.
Materiality: Silk, Chrome, Glass, and semi-transparent resin.
Palette: Iridescent Mother-of-Pearl, Champagne Gold, and Soft Lavender.
`;
