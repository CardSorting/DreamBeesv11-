const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const MODELS = [
    'cat-carrier'
];

const BASE_OUTPUT_DIR = path.join(__dirname, '../public/showcase');

const PROMPTS = [
    { name: 'cyberpunk_portrait', prompt: 'masterpiece, best quality, 1girl, cyberpunk, neon aesthetic, urban, mechanical parts, glowing eyes, cinematic lighting, highly detailed' },
    { name: 'fantasy_forest', prompt: 'masterpiece, best quality, magical forest, bioluminescent plants, ethereal atmosphere, fireflies, soft fog, dreamlike, fantasy landscape' },
    { name: 'scifi_station', prompt: 'masterpiece, best quality, futuristic space station interior, sleek white panels, holographic displays, window looking out to deep space, nebulae' },
    { name: 'anime_cafe', prompt: 'masterpiece, best quality, cozy cafe interior, rain on window, warm lighting, anime style, lo-fi aesthetic, detailed food and drinks' },
    { name: 'mecha_battle', prompt: 'masterpiece, best quality, giant mecha robot, battle stance, explosions in background, detailed armor, lens flare, dynamic angle' },
    { name: 'watercolor_landscape', prompt: 'masterpiece, best quality, rolling hills, watercolor style, soft pastel colors, traditional art medium, serene, fluffy clouds' },
    { name: 'synthwave_city', prompt: 'masterpiece, best quality, synthwave city, retrowave, purple and cyan, grid floor, sunset, palm trees, 80s aesthetic' },
    { name: 'space_marine', prompt: 'masterpiece, best quality, space marine, power armor, battle worn, holding rifle, alien planet background, dust, smoke' },
    { name: 'isometric_room', prompt: 'masterpiece, best quality, isometric 3d render, cute gamer room, pastel colors, soft lighting, 3d blender style' },
    { name: 'steampunk_inventor', prompt: 'masterpiece, best quality, steampunk inventor, brass goggles, workshop, gears and steam, cinematic lighting, detailed clothes' },
    { name: 'underwater_city', prompt: 'masterpiece, best quality, bioshock style underwater city, art deco architecture, schools of fish, light rays filtering down, ocean depth' },
    { name: 'pixel_art_adventurer', prompt: 'masterpiece, best quality, pixel art style, 16-bit, adventurer standing on cliff edge, looking at castle in distance, sunset' },
    { name: 'oil_painting_cottage', prompt: 'masterpiece, best quality, oil painting, impasto, cozy cottage, flower garden, sunny day, claude monet style' },
    { name: 'glitch_art_portrait', prompt: 'masterpiece, best quality, abstract portrait, glitch art, datamosh, vhs static, neon colors, distorted face' },
    { name: 'origami_zoo', prompt: 'masterpiece, best quality, paper craft style, origami animals, paper zoo, depth of field, tilt shift, bright colors' },
    { name: 'pencil_sketch_street', prompt: 'masterpiece, best quality, graphite pencil sketch, narrow european street, cafe tables, cobblestone, rough texture, detailed shading' },
    { name: 'low_poly_mountain', prompt: 'masterpiece, best quality, low poly style, mountain landscape, geometric shapes, flat shading, vibrant colors, minimalist' },
    { name: 'stained_glass_window', prompt: 'masterpiece, best quality, stained glass window, intricate pattern, sunlight streaming through, colorful church interior' },
    { name: 'ukiyo_e_wave', prompt: 'masterpiece, best quality, ukiyo-e style, great wave, japanese woodblock print, traditional art, mount fuji in background' },
    { name: 'macro_insect', prompt: 'masterpiece, best quality, macro photography, mechanical insect, clockwork beetle, depth of field, metallic texture, detailed gears' },
    { name: 'vaporwave_statue', prompt: 'masterpiece, best quality, vaporwave aesthetic, marble statue head, windows 95 ui elements, palm leaves, pink and blue gradients' },
    { name: 'noir_detective', prompt: 'masterpiece, best quality, film noir style, detective in trench coat, rainy city street, black and white, dramatic shadows, street light' },
    { name: 'claymation_alien', prompt: 'masterpiece, best quality, claymation style, cute alien creature, plasticine texture, stop motion look, moon surface' },
    { name: 'pop_art_explosion', prompt: 'masterpiece, best quality, pop art style, comic book explosion, halftone dots, roy lichtenstein style, bold lines, bright primary colors' },
    { name: 'bioware_armor', prompt: 'masterpiece, best quality, organic bio-armor, hr giger style but clean, sleek chitin, glowing veins, character concept' },
    { name: 'vector_flat_office', prompt: 'masterpiece, best quality, vector art, flat design, modern office workspace, clean lines, corporate memphis style, minimalist' },
    { name: 'gothic_cathedral', prompt: 'masterpiece, best quality, gothic cathedral interior, vaulted ceilings, eerie mist, candlelight, dark atmosphere, photorealistic' },
    { name: 'cinematic_samurai', prompt: 'masterpiece, best quality, cinematic shot, samurai warrior, cherry blossom forest, petals falling, katana drawn, shallow depth of field' },
    { name: 'retro_futurism_car', prompt: 'masterpiece, best quality, retro futurism, 1950s flying car, chrome fins, atomic age, hover technology, utopian city background' },
    { name: 'double_exposure_bear', prompt: 'masterpiece, best quality, double exposure photography, silhouette of bear, pine forest inside silhouette, northern lights, starry sky' },
    { name: 'lego_castle', prompt: 'masterpiece, best quality, lego pieces, medieval castle, plastic texture, depth of field, miniature photography style' },
    { name: 'neon_sign_rain', prompt: 'masterpiece, best quality, close up, neon sign reflecting in puddle, rain drops, bokeh city lights, urban night atmosphere' },
    { name: 'marble_bust_flowers', prompt: 'masterpiece, best quality, classical marble bust, exploding with colorful flowers instead of head, surrealism, dali style, studio lighting' },
    { name: 'cyber_samurai_girl', prompt: 'masterpiece, best quality, cybernetic samurai girl, glowing katana, neon rain, futuristic tokyo background, detailed mechanical limbs' },
    { name: 'art_nouveau_witch', prompt: 'masterpiece, best quality, art nouveau style, much, witch brewing potion, intricate borders, gold leaf details, flowing hair, stained glass background' },
    { name: 'miniature_library', prompt: 'masterpiece, best quality, tilt shift photography, miniature library inside a glass bottle, tiny books, warm lighting, magical atmosphere' },
    { name: 'crystal_dragon', prompt: 'masterpiece, best quality, translucent crystal dragon, refracting light, prism effect, cavern setting, detailed scales, fantasy creature' },
    { name: 'knolling_camera_gear', prompt: 'masterpiece, best quality, knolling photography, vintage camera gear disassembled, organized neatly, overhead shot, clean background, technical' },
    { name: 'bioluminescent_jellyfish', prompt: 'masterpiece, best quality, deep sea underwater, giant bioluminescent jellyfish, glowing blue and purple, dark ocean, national geographic style' },
    { name: 'paper_cutout_forest', prompt: 'masterpiece, best quality, layered paper cutout art, shadow box style, deep dark forest, depth effect, silhouettes, moon lighting' },
    { name: 'soviet_brutalist_bus_stop', prompt: 'masterpiece, best quality, brutalist architecture, concrete bus stop, snow covered landscape, overcast sky, melancholic atmosphere' },
    { name: 'rococo_spaceship', prompt: 'masterpiece, best quality, spaceship interior in rococo style, gold ornate details, pastel pink and blue, intricate carvings, luxury sci-fi' },
    { name: 'felt_puppet_monster', prompt: 'masterpiece, best quality, felt texture, cute fuzzy monster puppet, muppet style, studio lighting, depth of field' },
    { name: 'double_exposure_wolf', prompt: 'masterpiece, best quality, double exposure, silhouette of howling wolf, snowy mountain landscape inside, aurora borealis, starry night' },
    { name: 'isometric_magic_shop', prompt: 'masterpiece, best quality, isometric 3d render, magic potion shop, floating items, glowing cauldons, purple lighting, cute style' },
    { name: 'graffiti_astronaut', prompt: 'masterpiece, best quality, street art style, graffiti mural of astronaut, spray paint texture, dripping paint, brick wall background' },
    { name: 'vintage_botanical_print', prompt: 'masterpiece, best quality, vintage botanical illustration, detailed scientific drawing of imaginary alien plant, aged paper texture' },
    { name: 'abstract_smoke_dancer', prompt: 'masterpiece, best quality, formed by colorful smoke, silhouette of dancer, dynamic pose, flowing swirls, black background, high contrast' },
    { name: 'ceramic_ghost', prompt: 'masterpiece, best quality, cute ceramic ghost figurine, glossy glaze, cracked porcelain texture, shelf background, soft indoor lighting' },
    { name: 'fractal_landscape', prompt: 'masterpiece, best quality, 3d fractal landscape, mandelbulb, mathematical geometry, alien terrain, infinite detail, psychedelic colors' },
    { name: 'blueprint_mecha', prompt: 'masterpiece, best quality, technical blueprint, giant robot schematic, cyanotype, white lines on blue background, detailed measurements' },
    { name: 'kintsugi_heart', prompt: 'masterpiece, best quality, broken stone heart repaired with gold kintsugi, dramatic lighting, symbolism, detailed texture' },
    { name: 'lego_food_truck', prompt: 'masterpiece, best quality, lego set, food truck, minifigures eating, city street, plastic texture, tilt shift macro' },
    { name: 'neon_noir_rain', prompt: 'masterpiece, best quality, cyberpunk detective, reflection in puddle, heavy rain, neon signs, blade runner vibe, cinematic' },
    { name: 'steampunk_owl', prompt: 'masterpiece, best quality, mechanical owl, brass feathers, clockwork eyes, perched on copper branch, steam vents, intricate gears' },
    { name: 'viking_longhouse', prompt: 'masterpiece, best quality, warm viking longhouse interior, fire pit, furs, wooden carvings, feast table, candle light' },
    { name: 'embroidery_landscape', prompt: 'masterpiece, best quality, embroidery art, stitched thread texture, mountain landscape, fabric background, handmade feel' },
    { name: 'bubble_macro', prompt: 'masterpiece, best quality, macro photography, soap bubble, iridescent colors, reflection of city, high detail, scientific' },
    { name: 'anime_idol_singer', prompt: 'masterpiece, best quality, anime style, cute idol singer performing on stage, sparkling dress, holding microphone, crowd silhouettes, stage lights, lens flare' },
    { name: 'school_library_girl', prompt: 'masterpiece, best quality, beautiful anime girl, reading book in sunny library, dust motes, school uniform, messy bun, peaceful atmosphere, makoto shinkai style' },
    { name: 'cherry_blossom_kimono', prompt: 'masterpiece, best quality, traditional japanese beauty, floral kimono, holding umbrella, falling cherry blossom petals, kyoto street background, soft focus' },
    { name: 'magical_girl_transformation', prompt: 'masterpiece, best quality, magical girl transformation sequence, floating ribbons, glowing symbols, glitter effects, dynamic pose, frilly dress, starry background' },
    { name: 'gothic_lolita_tea', prompt: 'masterpiece, best quality, gothic lolita fashion, dark victorian interior, drinking tea, elaborate dress with lace, doll-like face, rose garden window' },
    { name: 'cyberpunk_hacker_girl', prompt: 'masterpiece, best quality, cool anime girl, headphones, holographic screens, messy server room, neon lighting, hoodie, determined expression' },
    { name: 'elf_archer_forest', prompt: 'masterpiece, best quality, fantasy elf girl, forest ranger attire, bow and arrow, perched on tree branch, ancient woods, dappled sunlight' },
    { name: 'maid_cafe_welcome', prompt: 'masterpiece, best quality, akihabara maid cafe, cute maid welcoming customer, curtsy pose, pastel colors, frilly apron, cake background' },
    { name: 'shrine_maiden_dance', prompt: 'masterpiece, best quality, miko shrine maiden, performing kagura dance, red hakama, shinto shrine background, autumn leaves falling, spiritual atmosphere' },
    { name: 'vampire_princess_castle', prompt: 'masterpiece, best quality, elegant vampire princess, pale skin, red eyes, gothic ballgown, sitting on throne, moonlit castle window, wine glass' },
    { name: 'beach_volleyball_summer', prompt: 'masterpiece, best quality, anime summer vibe, girl playing beach volleyball, splashing water, blue sky, tropical ocean, dynamic action shot' },
    { name: 'winter_scarf_girl', prompt: 'masterpiece, best quality, cute girl in winter, snowy street, knitted scarf covering mouth, rosy cheeks, snowflakes falling, warm breath vapor, night lights' },
    { name: 'steampunk_mechanic_girl', prompt: 'masterpiece, best quality, steampunk mechanic girl, grease smudges on face, goggles, holding wrench, airship engine room, brass gears, confident smile' },
    { name: 'urban_skater_girl', prompt: 'masterpiece, best quality, streetwear fashion, skater girl, holding skateboard, graffiti alley, sunset lighting, cool sneakers, oversized hoodie' },
    { name: 'demon_slayer_katana', prompt: 'masterpiece, best quality, fierce demon slayer girl, drawing katana, lightning effects, traditional pattern kimono, battle stance, night foreset' },
    { name: 'angel_wings_sky', prompt: 'masterpiece, best quality, beautiful angel girl, white feathered wings spreading, floating in blue sky, sun rays, ethereal white dress, holy atmosphere' },
    { name: 'casual_gamer_girl', prompt: 'masterpiece, best quality, cozy room, gamer girl playing on console, beanbag chair, messy hair, oversized t-shirt, rgb pc in background, snacks' },
    { name: 'witch_academia_potion', prompt: 'masterpiece, best quality, witch academy student, stirring glowing potion, cauldron smoke, magical sparks, library of spellbooks, curious expression' },
    { name: 'race_queen_circuit', prompt: 'masterpiece, best quality, race queen, holding umbrella, race track background, f1 car, latex outfit, sunny day, high contrast' },
    { name: 'nekomimi_pet_shop', prompt: 'masterpiece, best quality, cute cat girl, nekomimi, large bell collar, sitting in box, paw gesture, fluffy tail, anime pet shop setting' },
    { name: 'samurai_sunset_duel', prompt: 'masterpiece, best quality, wandering samurai girl, windy field, susuki grass, sunset silhouette, intense stare, hand on hilt, cinema scope' },
    { name: 'space_pilot_cockpit', prompt: 'masterpiece, best quality, anime space pilot, inside mecha cockpit, complex hud, star field outside, helmet visor reflection, sci-fi plug suit' },
    { name: 'office_lady_sunset', prompt: 'masterpiece, best quality, tired office lady, loosening tie, city skyline sunset through window, high rise office, bokeh city lights, realistic anime style' },
    { name: 'princess_knight_rose', prompt: 'masterpiece, best quality, knight princess, silver armor with rose engravings, sword planted in ground, royal cape, castle garden, noble stance' },
    { name: 'mermaid_coral_reef', prompt: 'masterpiece, best quality, beautiful mermaid, swimming in coral reef, schools of colorful fish, underwater sunbeams, wet hair, shimmering scales' },
    { name: 'dragon_slayer_flame', prompt: 'masterpiece, best quality, shonen anime hero, young dragon slayer, wielding massive greatsword, engulfed in flames, fierce expression, battle stance, rocky wasteland background' },
    { name: 'lightning_ninja_roof', prompt: 'masterpiece, best quality, cool ninja boy, blue lightning crackling around hands, standing on traditional japanese roof, moonlight, dynamic angle, blowing scarf' },
    { name: 'soccer_striker_shot', prompt: 'masterpiece, best quality, sports anime, intense soccer striker, mid-air bicycle kick, motion blur, flaming aura effect, stadium lights, determined eyes' },
    { name: 'spirit_detective_alley', prompt: 'masterpiece, best quality, spirit detective, green school uniform, glowing spectral energy finger gun, dark alleyway, delinquent hairstyle, confidence' },
    { name: 'mecha_pilot_ace', prompt: 'masterpiece, best quality, male mecha pilot ace, plugsuit, confident smirk, leaning against giant robot leg, hangar background, sparks, sci-fi anime style' },
    { name: 'cursed_exorcist', prompt: 'masterpiece, best quality, jujutsu sorcerer style, blindfold, spiked hair, black uniform, hand sign, dark purple cursed energy, abandoned building' },
    { name: 'pirate_captain_deck', prompt: 'masterpiece, best quality, anime pirate captain, red coat, straw hat, grinning wildly, ship deck, ocean spray, seagulls, adventure awaits' },
    { name: 'fullmetal_alchemist_circle', prompt: 'masterpiece, best quality, young alchemist, drawing transmutation circle, blue alchemical lightning, red cloak, blonde braided hair, steampunk setting' },
    { name: 'martial_artist_aura', prompt: 'masterpiece, best quality, muscular martial artist, gi torn, golden energy aura, powering up, floating rocks, intense screaming expression, dragon ball style' },
    { name: 'wandering_swordsman_ronin', prompt: 'masterpiece, best quality, wandering ronin, cross-shaped scar on cheek, red kimono, katana on hip, bamboo forest, wind blowing leaves, stoic' },
    { name: 'beast_tamer_wolf', prompt: 'masterpiece, best quality, wild beast tamer boy, wolf ears and tail, crouching with giant white wolf, forest clearing, tribal markings, fierce bond' },
    { name: 'cyborg_soldier_gun', prompt: 'masterpiece, best quality, cyborg soldier, mechanical arm, holding futuristic railgun, red optical eye, dystopian city ruins, dust and debris' },
    { name: 'demon_king_throne', prompt: 'masterpiece, best quality, cool demon king, horns, black wings, sitting arrogantly on obsidian throne, red wine glass, dark castle hall' },
    { name: 'isekai_hero_summon', prompt: 'masterpiece, best quality, isekai hero, just summoned, holding legendary shield, confused expression, magic circle on floor, fantasy guild hall' },
    { name: 'rival_dark_swordsman', prompt: 'masterpiece, best quality, anime rival character, black trenchcoat, long silver hair, dual wielding swords, rainy rooftop, menacing glare' },
    { name: 'student_council_president', prompt: 'masterpiece, best quality, student council president, glasses, adjusting tie, stern look, holding clipboard, school hallway, sunset lighting' },
    { name: 'basketball_zone_dunk', prompt: 'masterpiece, best quality, basketball player, entering the zone, eyes glowing streams of light, slamming dunk, shattered backboard effect' },
    { name: 'butler_combat_ready', prompt: 'masterpiece, best quality, combat butler, throwing knives between fingers, pristine tuxedo, elegant pose, mansion hallway, motion lines' },
    { name: 'phantom_thief_moon', prompt: 'masterpiece, best quality, phantom thief, top hat, cape, monocle, standing on clock tower hand, full moon background, holding calling card' },
    { name: 'sniper_ghillie_suit', prompt: 'masterpiece, best quality, anime sniper, ghillie suit, looking through scope, forest camouflage, intense focus, lens reflection' },
    { name: 'street_brawler_fist', prompt: 'masterpiece, best quality, tough street brawler, bandaged knuckles, punching towards camera, impact shockwave, urban graffiti background' },
    { name: 'shadow_summoner', prompt: 'masterpiece, best quality, shadow summoner, emerging from shadows, dark creatures forming around him, glowing purple eyes, gothic alley' },
    { name: 'ice_mage_prince', prompt: 'masterpiece, best quality, ice mage prince, creating ice shards, frozen breath, white hair, royal blue robes, snow palace background' },
    { name: 'post_apocalyptic_drifter', prompt: 'masterpiece, best quality, wasteland drifter, goggles, gas mask hanging on neck, makeshift armor, dusty desert, rusty motorcycle' },
    { name: 'card_duelist_draw', prompt: 'masterpiece, best quality, anime card game player, dramatic card draw, energetic pose, monsters emerging from cards, ancient egypt background' },
    // --- BATCH 5: 100 Pop Culture Styles ---
    { name: 'ghibli_grassland', prompt: 'masterpiece, best quality, studio ghibli style, vast green grassland, moving castle in distance, billowing white clouds, vibrant blue sky, painted texture' },
    { name: 'shinkai_sunset_train', prompt: 'masterpiece, best quality, makoto shinkai style, train interior at sunset, intense lens flare, dust particles, hyper-detailed lighting, emotional atmosphere' },
    { name: 'monitor_head_vibe', prompt: 'masterpiece, best quality, object head, tv head monitor, retro anime aesthetic, glitched screen face, wearing hoodie, lo-fi bedroom' },
    { name: 'trigger_fighter_pose', prompt: 'masterpiece, best quality, studio trigger style, dynamic exaggerated perspective, loud colors, jagged lines, flaming sword, screaming expression, impact frames' },
    { name: 'kyoto_animation_eyes', prompt: 'masterpiece, best quality, kyoto animation style, extreme close up on eyes, intricate eye detail, reflections, emotional tears, soft lighting, hair strands' },
    { name: 'jojo_stand_user', prompt: 'masterpiece, best quality, jojo style, menacing rumble kanji, stylish pose, colorful aura, stand summon behind, bold lines, dramatic shading, araki style' },
    { name: 'chainsaw_man_urban', prompt: 'masterpiece, best quality, gritty urban fantasy, suit and tie, devil hunter, blood splatter style, muted colors, film grain, cinematic composition' },
    { name: 'sailor_moon_transform', prompt: 'masterpiece, best quality, 90s anime aesthetic, magical girl transformation background, silhouette with ribbons, pastel gradients, sparkles, retro tv scanlines' },
    { name: 'evangelion_entry_plug', prompt: 'masterpiece, best quality, lcl fluid amber lighting, entry plug interior, interface holograms, plugsuit, psychological horror vibe, distorted angles' },
    { name: 'cowboy_bebop_jazz', prompt: 'masterpiece, best quality, space western, smoking cigarette, jazz club, noir lighting, cool attitude, spike spiegel vibe, retro futurism' },
    { name: 'berserk_eclipse', prompt: 'masterpiece, best quality, dark fantasy, eclipse sun, grotesque scenery, heavy hatching lines, manga style inking, despair atmosphere, miura style' },
    { name: 'frieren_journey', prompt: 'masterpiece, best quality, elf mage walking, melancholic fantasy landscape, passing of time, soft watercolor background, peaceful stillness' },
    { name: 'spy_family_elegant', prompt: 'masterpiece, best quality, 1960s spy aesthetic, elegant suit and dress, silencer pistol, peanuts, stylish furniture, mid-century modern background' },
    { name: 'one_piece_adventure', prompt: 'masterpiece, best quality, wide shot ocean adventure, pirate ship sunny, seagulls, bright tropical colors, oda style, exaggerated expressions' },
    { name: 'naruto_sage_mode', prompt: 'masterpiece, best quality, ninja sage mode, orange eyeshadow, toad summon, nature energy aura, forest training ground, dynamic action' },
    { name: 'bleach_bankai', prompt: 'masterpiece, best quality, soul reaper, katana bankai release, black reiatsu energy, white kimono, hollow mask, high contrast black and white style' },
    { name: 'demon_slayer_hinokami', prompt: 'masterpiece, best quality, hinokami kagura, sun breathing, flaming sword slash, ukiyo-e flame effects, snowy forest night, intense action' },
    { name: 'aot_titan_steam', prompt: 'masterpiece, best quality, giant titan steam, wall maria background, grappling hook gear, mid-air maneuver, motion lines, gritty texture' },
    { name: 'hxg_hunter_aura', prompt: 'masterpiece, best quality, nen aura, terrifying pressure, dark continent creature, strategy mood, detailed line work, togashi style' },
    { name: 'gundam_space_battle', prompt: 'masterpiece, best quality, giant mobile suit, beam saber clash, space colony background, laser blasts, mechanical detail, 80s mecha shading' },
    { name: 'akira_bike_slide', prompt: 'masterpiece, best quality, red motorcycle slide, leaving light trails, neo tokyo skyline at night, cyberpunk explosions, otomo katsuhiro style' },
    { name: 'ghost_in_shell_diving', prompt: 'masterpiece, best quality, cybernetic brain dive, digital data stream, optical camouflage, urban cyberpunk city, philosophical mood' },
    { name: 'violet_evergarden_type', prompt: 'masterpiece, best quality, auto memory doll, mechanical hands typing, flying letters, emotional lighting, victorian setting, detailed flowers' },
    { name: 'madoka_witch_labyrinth', prompt: 'masterpiece, best quality, collage art style, surreal witch labyrinth, scissors and paper textures, unsettling cute horror, psychedelic patterns' },
    { name: 'mob_psycho_explosion', prompt: 'masterpiece, best quality, psychic energy explosion, crayon scribble effects, 100% emotion, floating debris, neon outline, one style' },
    { name: 'opm_serious_punch', prompt: 'masterpiece, best quality, one punch impact, clouds parting globally, shockwave, minimalist hero face, intense action lines, murata detail' },
    { name: 'death_note_writing', prompt: 'masterpiece, best quality, dramatic potato chip eating, gothic lighting, shinigami lurking in shadow, notebook, intense psychological tension' },
    { name: 'pokemon_trainer_camp', prompt: 'masterpiece, best quality, cozy camping with monster partners, cooking curry, forest clearing, warm lighting, ken sugimori watercolor style' },
    { name: 'digimon_digital_world', prompt: 'masterpiece, best quality, digital world landscape, floating data islands, circuit board textures, monster evolution glowing, adventure vibe' },
    { name: 'yugioh_shadow_realm', prompt: 'masterpiece, best quality, ancient egyptian duel, millennium puzzle glowing, dark purple fog, giant monster hologram, sharp angular hair' },
    { name: 'fate_noble_phantasm', prompt: 'masterpiece, best quality, noble phantasm release, golden light particles, epic fantasy armor, heroic spirit, unlimited blade works' },
    { name: 'touhou_bullet_hell', prompt: 'masterpiece, best quality, danmaku pattern background, shrine maiden flying, colorful energy bullets, frilly dress, gensokyo landscape' },
    { name: 'hatsune_miku_concert', prompt: 'masterpiece, best quality, virtual idol concert, glow sticks crowd, teal pigtails, digital stage effects, hologram shaders, futuristic' },
    { name: 'persona_all_out', prompt: 'masterpiece, best quality, all out attack finisher, red and black style, stylized silhouette, comic book sound effects, cool composition, mask' },
    { name: 'danganronpa_execution', prompt: 'masterpiece, best quality, punishment time, neon pink blood, pop art style, despair bear mascot, classroom trial setting, psychopop' },
    { name: 'ace_attorney_objection', prompt: 'masterpiece, best quality, finger pointing objection, courtroom anime style, speed lines, sweat drop, desk slam, intense debate' },
    { name: 'nier_automata_ruins', prompt: 'masterpiece, best quality, 2b android, post apocalyptic city ruins, overgrown vegetation, white hair, black dress, blindfold, melancholic beauty' },
    { name: 'zelda_botw_landscape', prompt: 'masterpiece, best quality, open air style, cell shaded landscape, guardian ruins, silent princess flowers, watercolor texture, vast horizon' },
    { name: 'mario_mushroom_kingdom', prompt: 'masterpiece, best quality, vibrant platformer world, floating blocks, green pipes, castle in background, bright primary colors, 3d render style' },
    { name: 'sonic_green_hill', prompt: 'masterpiece, best quality, loop de loop grass, checkerboard soil, blue blur speed lines, golden rings, sunny blue sky, sega aesthetic' },
    { name: 'final_fantasy_crystal', prompt: 'masterpiece, best quality, giant floating crystal, fantasy airship, chocobo running, detailed rpg armor, magic particles, square enix style' },
    { name: 'kingdom_hearts_twilight', prompt: 'masterpiece, best quality, twilight town clock tower, sea salt ice cream, keyblade, zipper details, sunset orange sky, emotional nostalgia' },
    { name: 'monster_hunter_cook', prompt: 'masterpiece, best quality, palico chef cooking massive meal, meat roasting, steam, rustic tavern, detailed food art, mouth watering' },
    { name: 'dark_souls_bonfire', prompt: 'masterpiece, best quality, knight resting at bonfire, dark fantasy ruins, embers, ominous fog, heavy armor, depressing atmosphere' },
    { name: 'elden_ring_erdtree', prompt: 'masterpiece, best quality, giant glowing gold tree, vast fantasy landscape, tarnished knight, horse riding, epic scale, oil painting vibe' },
    { name: 'cyberpunk_edgerunners_moon', prompt: 'masterpiece, best quality, sandevistan trails, neon hallucinations, moon staring, yellow jacket, trigger style colors, tragic romance' },
    { name: 'arcane_jinx_smoke', prompt: 'masterpiece, best quality, painted texture 3d, blue smoke flares, graffiti, steampunk city piltover, expressive facial animation, riot style' },
    { name: 'spider_verse_leap', prompt: 'masterpiece, best quality, leap of faith, upside down city, chromatic aberration, comic dots, glitch effects, stylized 3d, vibrant colors' },
    { name: 'blue_period_art', prompt: 'masterpiece, best quality, oil painting texture overlay, art student painting, emotional blue lighting, messy apron, canvas focus, creative flow' },
    { name: 'bocchi_the_rock_glitch', prompt: 'masterpiece, best quality, social anxiety glitch, melting face, cubist distortion, pink track suit, guitar, funny abstract animation style' },
    { name: 'k-on_tea_time', prompt: 'masterpiece, best quality, kyoto animation moeblob, girls band, cake and tea, music room, soft fluffy atmosphere, warm afternoon light' },
    { name: 'nichijou_reaction', prompt: 'masterpiece, best quality, exaggerated shock reaction, laser beam mouth, simplistic style turned epic, helvetica standard, surreal comedy' },
    { name: 'pop_team_epic_meme', prompt: 'masterpiece, best quality, crappy art style intentional, middle fingers, surreal humor, 4koma manga style, chaotic energy' },
    { name: 'lucky_star_dance', prompt: 'masterpiece, best quality, sailor uniform, cheering pose, moe art style, colorful background, 2000s anime aesthetic, otaku culture' },
    { name: 'haruhi_god_pose', prompt: 'masterpiece, best quality, arms crossed bossy pose, yellow ribbon, sos brigade classroom, aliens time travelers espers, iconic anime scene' },
    { name: 'toradora_palm_tiger', prompt: 'masterpiece, best quality, palm top tiger, tsundere expression, wooden katana, school uniform, messy apartment, romantic comedy vibe' },
    { name: 'clannad_dango', prompt: 'masterpiece, best quality, key visual novel style, big sad eyes, dango family plushies, cherry blossom hill, emotional drama, soft shading' },
    { name: 'angel_beats_piano', prompt: 'masterpiece, best quality, girl playing piano, disappearing light particles, afterlife school gym, emotional performance, sunset gradient' },
    { name: 'anohana_flower', prompt: 'masterpiece, best quality, ghost girl white dress, summer heat haze, secret base, crying friends, nostalgic emotional flower, blue sky' },
    { name: 'your_lie_in_april_violin', prompt: 'masterpiece, best quality, vibrant violin performance, cherry blossoms exploding, stage lights, crying while playing, colorful emotional synesthesia' },
    { name: 'fruits_basket_zodiac', prompt: 'masterpiece, best quality, shoujo manga style, soft sparkles, zodiac animals, gentle smiling girl, onigiri, heartfelt atmosphere' },
    { name: 'nana_punk_band', prompt: 'masterpiece, best quality, punk rock fashion, cigarette smoke, microphone stand, vivienne westwood jewelry, josei style, dramatic lighting' },
    { name: 'paradise_kiss_fashion', prompt: 'masterpiece, best quality, high fashion runway, atelier setting, blue dress, elegant art style, detailed clothing texture, stylish' },
    { name: 'utena_rose_duel', prompt: 'masterpiece, best quality, surreal rose garden, duelist uniform, sword pulled from chest, shadow girls, shoujo revolution, aesthetics' },
    { name: 'cardcaptor_sakura_fly', prompt: 'masterpiece, best quality, clamp art style, frilly battle costume, clow cards flying, sealing staff, wings, flowers everywhere' },
    { name: 'chobits_persocom', prompt: 'masterpiece, best quality, clamp style, ears interface, wires, abandoned city street light, romantic robot, flowing hair' },
    { name: 'lain_wired_room', prompt: 'masterpiece, best quality, messy room with computer wires, buzzing power lines, shadows, psychological horror, bear suit, static noise' },
    { name: 'haibane_renmei_wings', prompt: 'masterpiece, best quality, grey wings, halo, walled city, watercolor background, peaceful slice of life, melancholic mystery' },
    { name: 'kino_journey_bike', prompt: 'masterpiece, best quality, traveler on talking motorcycle, beautiful landscape, revolver on hip, philosophical atmosphere, wide angle' },
    { name: 'mushi_shi_nature', prompt: 'masterpiece, best quality, glowing ethereal lifeforms, medicine seller, lush forest, quiet atmosphere, traditional japan, supernatural beauty' },
    { name: 'natsume_book_friends', prompt: 'masterpiece, best quality, boy returning name, paper flying, yokai spirits, fat cat spirit, gentle atmosphere, countryside shrine' },
    { name: 'mononoke_medicine_seller', prompt: 'masterpiece, best quality, paper texture overlay, vibrant flat colors, ukiyo-e horror, medicine seller with sword, abstract spirit patterns' },
    { name: 'tatami_galaxy_fast', prompt: 'masterpiece, best quality, yuasa style, simple flat colors, fast motion blur, college life surrealism, clockwork background, unique art' },
    { name: 'ping_pong_animation', prompt: 'masterpiece, best quality, sketchy shaky lines, yuasa style, intense ping pong rally, sweat flying, distorted perspective, raw energy' },
    { name: 'devilman_crybaby_neon', prompt: 'masterpiece, best quality, yuasa style, neon strobe lights, demon transformation, running track, drug trip visuals, intense sexuality and violence' },
    { name: 'flcl_vespa_guitar', prompt: 'masterpiece, best quality, yellow vespa, gibson guitar, robot popping out of head, chaotic action, manga panels background, gainax style' },
    { name: 'gurren_lagann_drill', prompt: 'masterpiece, best quality, drill that will pierce the heavens, galaxy background, giant robot sunglasses, burning fighting spirit, epic scale' },
    { name: 'kill_la_kill_scissor', prompt: 'masterpiece, best quality, scissor blade, living school uniform, chaotic academy, bold red text overlay, dynamic action pose' },
    { name: 'promare_fire', prompt: 'masterpiece, best quality, geometric fire effects, pastel neon colors, firefighter mech, trigger style, minimalist shading, high contrast' },
    { name: 'lwa_broom_flight', prompt: 'masterpiece, best quality, witch academy, flying on broom, shiny magic trail, energetic expression, fantasy sky, anime harry potter vibe' },
    { name: 'bna_beast_city', prompt: 'masterpiece, best quality, neon furry city, tanuki girl transformation, pop art colors, synthwave aesthetic, trigger style, night life' },
    { name: 'cyberpunk_lucy_wire', prompt: 'masterpiece, best quality, monowire weapon, glowing orange, netrunner suit, night city background, chromatic aberration, trigger aesthetic' },
    { name: 'dorohedoro_gyoza', prompt: 'masterpiece, best quality, gritty grunge texture, lizard head man, cooking gyoza, dirty smoke, dark fantasy humor, detailed background' },
    { name: 'tokyo_ghoul_mask', prompt: 'masterpiece, best quality, zipper mask, red kagune tentacles, white hair, shattered glass reflection, dark urban horror, tragedy' },
    { name: 'parasyte_hand', prompt: 'masterpiece, best quality, morphing hand eye, body horror, high school setting, philosophical alien, tense atmosphere, anime horror' },
    { name: 'junji_ito_spiral', prompt: 'masterpiece, best quality, horror manga style, black and white inking, obsessed with spirals, creepy atmosphere, detailed line work' },
    { name: 'higurashi_cute_horror', prompt: 'masterpiece, best quality, cute country girls, sunset cicadas crying, hidden weapon, psychological horror contrast, blood splatter' },
    { name: 'madoka_magica_walpurgis', prompt: 'masterpiece, best quality, giant gear witch, upside down city, magical girls fighting, tragic atmosphere, shaft head tilt' },
    { name: 'made_in_abyss_hole', prompt: 'masterpiece, best quality, giant abyss hole, lush layer visuals, cute chibi characters, hidden eldritch horror, fantasy adventure' },
    { name: 'promised_neverland_wall', prompt: 'masterpiece, best quality, orphanage kids, white uniforms, standing at the gate, forest background, suspenseful atmosphere, fish eye lens' },
    { name: 're_zero_witch_scent', prompt: 'masterpiece, best quality, return by death, black shadow hands, witch scent miasma, crying desperation, fantasy mansion' },
    { name: 'overlord_tomb', prompt: 'masterpiece, best quality, ainz ooal gown, skeleton mage, floor guardians, nazarick throne room, dark fantasy power fantasy' },
    { name: 'slime_isekai_rimuru', prompt: 'masterpiece, best quality, cute blue slime, human form transformation, goblin village, cheerful atmosphere, sword and magic' },
    { name: 'konosuba_explosion', prompt: 'masterpiece, best quality, explosion magic chant, chunibyo pose, goofy faces, fantasy party dysfunction, bright comedy colors' },
    { name: 'shield_hero_rage', prompt: 'masterpiece, best quality, curse shield, glowing green fire, rage face, iron maiden skill, fantasy defense, gritty isekai' },
    { name: 'sword_art_online_menu', prompt: 'masterpiece, best quality, dual wielding swords, floating ui menu, boss room, digital particle effects, virtual reality mmo style' },
    { name: 'login_horizon_studying', prompt: 'masterpiece, best quality, round table conference, adjusting glasses, strategy map, mmo interface, politics in fantasy, detailed background' },
    { name: 'no_game_no_life_colors', prompt: 'masterpiece, best quality, oversaturated colors, red outlines, chess board world, floating cards, sora and shiro, fantasy game' },
    { name: 'classroom_elite_stare', prompt: 'masterpiece, best quality, cold calculating stare, manipulating from shadows, high school elite, psychological thriller vibe' },
    { name: 'kaguya_sama_love_war', prompt: 'masterpiece, best quality, cute mental battle, chibi devil narrator, student council room, romantic tension, red heart background' },
    { name: 'komi_san_cat_ears', prompt: 'masterpiece, best quality, silent beauty, sudden cat ears pop up, notebook communication, classroom setting, wholesome comedy' },
    // --- BATCH 6: 100 Beautiful Anime Characters ---
    { name: 'ethereal_forest_elf', prompt: 'masterpiece, best quality, beautiful anime elf girl, long silver hair, emerald eyes, white sundress, ancient tree background, fireflies, soft morning light' },
    { name: 'cyber_vogue_idol', prompt: 'masterpiece, best quality, beautiful cyberpunk pop idol, neon visor (raised), holographic wings, shiny latex outfit, stage lights, futuristic tokyo skyline, concerts atmosphere' },
    { name: 'crimson_witch_library', prompt: 'masterpiece, best quality, beautiful witch, deep crimson hat and robe, floating grimoires, magical library, glowing runes, mysterious smile, candlelight' },
    { name: 'sunflower_summer_girl', prompt: 'masterpiece, best quality, beautiful anime girl, straw hat, white sundress, sunflower field, bright blue sky, puffy clouds, brilliant sunlight, cheerful smile' },
    { name: 'moonlight_assassin', prompt: 'masterpiece, best quality, beautiful female assassin, sleek black bodysuit, rooftop at night, full moon, silver hair blowing in wind, intense gaze, dual daggers' },
    { name: 'royal_ice_queen', prompt: 'masterpiece, best quality, beautiful ice queen, crystal crown, pale blue skin, elegant frost gown, throne of ice, snowing indoors, cold haughty expression' },
    { name: 'steampunk_aviator_girl', prompt: 'masterpiece, best quality, beautiful aviator girl, leather flight cap, brass goggles, white scarf, piloting vintage airship, clouds, golden hour lighting, adventurous' },
    { name: 'aquatic_mermaid_princess', prompt: 'masterpiece, best quality, beautiful mermaid princess, pearlescent scales, coral crown, underwater palace, schools of tropical fish, light beams filtering down' },
    { name: 'gothic_lolita_doll', prompt: 'masterpiece, best quality, beautiful gothic lolita, frilly black dress, parasol, rose garden, victorian mansion background, porcelain skin, red eyes' },
    { name: 'shrine_maiden_autumn', prompt: 'masterpiece, best quality, beautiful shrine maiden (miko), sweeping leaves, red and white traditional robes, autumn maple trees, torii gate, peaceful atmosphere' },
    { name: 'futuristic_android_beauty', prompt: 'masterpiece, best quality, beautiful android girl, visible mechanical joints, porcelain skin, glowing blue circuitry lines, sterile white laboratory, sci-fi aesthetic' },
    { name: 'desert_dancer_sunset', prompt: 'masterpiece, best quality, beautiful exotic dancer, sheer silks, gold jewelry, desert dunes, sunset, oasis background, graceful pose, warm lighting' },
    { name: 'battle_angel_ruins', prompt: 'masterpiece, best quality, beautiful battle angel, metallic wings, damaged armor, standing in ruins, sword in hand, ray of hope, feathers falling, cinematic composition' },
    { name: 'violinist_in_rain', prompt: 'masterpiece, best quality, beautiful anime girl playing violin, rainy street, reflection in puddles, streetlights, emotional expression, water droplets, dramatic atmosphere' },
    { name: 'vintage_tea_maid', prompt: 'masterpiece, best quality, beautiful victorian maid, pouring tea, elegant parlor, afternoon sun, dust motes, gentle smile, classic anime style' },
    { name: 'neon_hacker_protagonist', prompt: 'masterpiece, best quality, beautiful hacker girl, oversized hoodie, messy room, multiple monitors, neon purple lighting, focus on screen, coding interface' },
    { name: 'dragon_tamer_priestess', prompt: 'masterpiece, best quality, beautiful dragon tamer, ceremonial robes, small dragon perched on shoulder, floating islands background, wind magic, mystical' },
    { name: 'office_lady_city_lights', prompt: 'masterpiece, best quality, beautiful office lady, business suit, looking out skyscraper window, night city bokeh, glass reflection, melancholic beauty' },
    { name: 'flower_spirit_dryad', prompt: 'masterpiece, best quality, beautiful dryad girl, hair made of vines and flowers, bark skin texture, lush rainforest, blooming orchids, nature goddess' },
    { name: 'space_fleet_commander', prompt: 'masterpiece, best quality, beautiful starship commander, white uniform with gold trim, bridge of spaceship, view of nebula, confident pose, saluting' },
    { name: 'vampire_countess_glass', prompt: 'masterpiece, best quality, beautiful vampire noblewoman, sipping red wine, velvet chesterfield sofa, fireplace, dark elegant room, pale skin, fangs' },
    { name: 'retro_pop_waitress', prompt: 'masterpiece, best quality, beautiful 50s diner waitress, roller skates, holding tray of burgers, checkerboard floor, jukebox, bright pop art colors' },
    { name: 'snow_leopard_girl', prompt: 'masterpiece, best quality, beautiful snow leopard kemonomimi, spotted ears and tail, thick fur coat, snowy mountain peak, blue eyes, winter cold' },
    { name: 'street_samurai_punk', prompt: 'masterpiece, best quality, beautiful punk samurai, dyed hair, leather jacket, katana with graffiti, neon alleyway, rain, rebellious attitude' },
    { name: 'celestial_goddess_prayer', prompt: 'masterpiece, best quality, beautiful goddess, praying hands, white robes, halo, clouds, sunbeams, divine atmosphere, ethereal glow' },
    { name: 'school_deliquent_leader', prompt: 'masterpiece, best quality, beautiful delinquent girl, sukeban long skirt, wooden sword, leaning on wall, graffiti art, tough expression, wind blowing hair' },
    { name: 'fairy_queen_throne', prompt: 'masterpiece, best quality, beautiful fairy queen, translucent butterfly wings, flower throne, giant mushrooms, magical forest glade, sparkling dust' },
    { name: 'mecha_pilot_plugsuit', prompt: 'masterpiece, best quality, beautiful mecha pilot, tight plugsuit, inside cockpit, interface glow on face, intense focus, sci-fi interior detailing' },
    { name: 'kumiho_nine_tails', prompt: 'masterpiece, best quality, beautiful nine-tailed fox spirit, hanbok, fox ears, nine fluffy tails, moonlight, mysterious temple, blue foxfire' },
    { name: 'library_bookworm_cozy', prompt: 'masterpiece, best quality, beautiful girl reading, giant pile of books, sweater, glasses, cozy library nook, warm lamp light, rain outside window' },
    { name: 'succubus_heart_charm', prompt: 'masterpiece, best quality, beautiful succubus, bat wings, heart shaped tail, gothic lingerie, blowing a kiss, pink and black aesthetic, seductive' },
    { name: 'painter_studio_messy', prompt: 'masterpiece, best quality, beautiful artist girl, paint on face and apron, holding palette, colorful canvas, sunlit art studio, creative chaos' },
    { name: 'cat_cafe_worker', prompt: 'masterpiece, best quality, beautiful cat cafe employee, cat ears headband, holding tray of cat treats, surrounded by kittens, pastel decor, wholesome' },
    { name: 'dark_elf_rogue', prompt: 'masterpiece, best quality, beautiful dark elf, grey skin, white hair, leather armor, dual daggers, cave with glowing crystals, stealthy pose' },
    { name: 'starry_sky_gazer', prompt: 'masterpiece, best quality, beautiful girl lying on grass, looking up at milky way, telescope nearby, shooting stars, night time, peaceful wonder' },
    { name: 'racer_girl_victory', prompt: 'masterpiece, best quality, beautiful race car driver, holding helmet, racing suit, checkered flag background, podium, champagne spray, victory smile' },
    { name: 'traditional_archer_kyudo', prompt: 'masterpiece, best quality, beautiful kyudo archer, hakama, drawing longbow, concentration, dojo setting, cherry blossoms, zen atmosphere' },
    { name: 'steampunk_clockmaker', prompt: 'masterpiece, best quality, beautiful clockmaker, magnifying glass eye, surrounding by clocks and gears, workbench, detailed brass mechanisms' },
    { name: 'bioluminescent_diver', prompt: 'masterpiece, best quality, beautiful deep sea diver, futuristic suit, bioluminescent plants, underwater ruins, bubbles, mysterious ocean' },
    { name: 'kitsune_mask_festival', prompt: 'masterpiece, best quality, beautiful girl at summer festival, yukata, holding kitsune mask, fireworks in background, lanterns, vibrant colors' },
    { name: 'zombie_hunter_apoc', prompt: 'masterpiece, best quality, beautiful survivor girl, dirty clothes, holding shotgun, abandonded city street, sunset, gritty atmosphere' },
    { name: 'crystal_maiden_cave', prompt: 'masterpiece, best quality, beautiful crystal maiden, dress made of diamonds, glittering cave, refraction of light, elegant pose, fantasy' },
    { name: 'cyber_geisha_future', prompt: 'masterpiece, best quality, beautiful cybernetic geisha, metallic face paint, neon kimono, futuristic tea house, digital shamisen, sci-fi japan' },
    { name: 'forest_guardian_deer', prompt: 'masterpiece, best quality, beautiful forest guardian, deer antlers, nature robes, surrounded by animals, sun filtering through leaves, peaceful' },
    { name: 'nurse_angel_healing', prompt: 'masterpiece, best quality, beautiful anime nurse, pink uniform, angel wings, giant syringe, hospital setting, hearts and sparkles, healing magic' },
    { name: 'skateboard_park_trick', prompt: 'masterpiece, best quality, beautiful skater girl, mid-air trick, skate park, graffiti, blue sky, wide angle lens, dynamic motion' },
    { name: 'victorian_vampire_hunter', prompt: 'masterpiece, best quality, beautiful vampire hunter, van helsing hat, crossbow, foggy london street, gaslight, gothic mystery' },
    { name: 'holographic_ai_assistant', prompt: 'masterpiece, best quality, beautiful ai avatar, translucent body, binary code rain, sci-fi interface, floating in server room, digital beauty' },
    { name: 'desert_nomad_oasis', prompt: 'masterpiece, best quality, beautiful nomad girl, scarf covering face, riding camel, sand dunes, oasis water, harsh sun, detailed fabric' },
    { name: 'baker_fresh_bread', prompt: 'masterpiece, best quality, beautiful bakery girl, holding basket of fresh bread, flour on cheek, rustic bakery interior, warm morning light' },
    { name: 'raincoat_frog_umbrella', prompt: 'masterpiece, best quality, beautiful girl in yellow raincoat, holding frog umbrella, heavy rain, hydrangea flowers, wet street, reflection' },
    { name: 'galaxy_hair_goddess', prompt: 'masterpiece, best quality, beautiful cosmic goddess, hair made of nebulae and stars, holding a planet, deep space background, infinite scope' },
    { name: 'tennis_player_serve', prompt: 'masterpiece, best quality, beautiful tennis player, mid-serve, motion blur, tennis court, sunny day, sweat drops, sports anime style' },
    { name: 'winter_soldier_russia', prompt: 'masterpiece, best quality, beautiful soldier, ushanka hat, thick winter coat, holding rifle, snowy red square background, cold breath' },
    { name: 'fire_dancer_festival', prompt: 'masterpiece, best quality, beautiful fire dancer, spinning fire poi, night beach party, flames trailing, intense focus, dynamic lighting' },
    { name: 'angel_fallen_wings', prompt: 'masterpiece, best quality, beautiful fallen angel, black wings, torn white dress, chains, dark stormy sky, tragic expression, dramatic' },
    { name: 'cyber_medic_drone', prompt: 'masterpiece, best quality, beautiful combat medic, healing drone hovering, futuristic battlefield, glowing energy shield, sci-fi armor' },
    { name: 'mermaid_siren_rock', prompt: 'masterpiece, best quality, beautiful siren, sitting on rock, stormy ocean, singing, ship in distance, mesmerizing beauty, dangerous' },
    { name: 'gym_fitness_girl', prompt: 'masterpiece, best quality, beautiful fitness girl, sport bra and leggings, gym setting, holding water bottle, sweat, ponytail, athletic body' },
    { name: 'samurai_blood_moon', prompt: 'masterpiece, best quality, beautiful samurai, red blood moon, field of spider lilies, katana, menacing atmosphere, dark fantasy' },
    { name: 'royal_guard_palace', prompt: 'masterpiece, best quality, beautiful royal guard, ornamental armor, standing at palace gate, red cape, stoic expression, marble pillars' },
    { name: 'techwear_urban_ninja', prompt: 'masterpiece, best quality, beautiful urban ninja, techwear fashion, straps and buckles, rooftop crouch, night city, face mask' },
    { name: 'wedding_dress_garden', prompt: 'masterpiece, best quality, beautiful bride, intricate lace wedding dress, veil, flower garden,gazebo, soft romantic lighting, happy tears' },
    { name: 'school_swimsuit_pool', prompt: 'masterpiece, best quality, beautiful girl in school swimsuit, cleaning pool, hose water spraying, summer heat, blue sky, shimmer' },
    { name: 'magical_library_spirit', prompt: 'masterpiece, best quality, beautiful book spirit, emerging from open book, letters floating, ancient library, magical dust, knowledge' },
    { name: 'cowgirl_western_town', prompt: 'masterpiece, best quality, beautiful cowgirl, sheriff badge, revolver, western saloon background, sunset, dust, wild west style' },
    { name: 'ice_skater_performance', prompt: 'masterpiece, best quality, beautiful figure skater, elegant pose, ice rink, spotlight, sequins sparkling, frozen motion, graceful' },
    { name: 'biopunk_experiment_girl', prompt: 'masterpiece, best quality, beautiful biopunk girl, plant symbiote, glass tank, laboratory, glowing green liquid, sci-fi horror beauty' },
    { name: 'autumn_park_bench', prompt: 'masterpiece, best quality, beautiful girl sitting on park bench, knitting scarf, falling orange leaves, park setting, soft focus, nostalgic' },
    { name: 'bunny_girl_casino', prompt: 'masterpiece, best quality, beautiful bunny girl, casino dealer, holding cards, roulette wheel, luxury background, red carpet, playful wink' },
    { name: 'pilot_cockpit_view', prompt: 'masterpiece, best quality, beautiful airplane pilot, cockpit pov, blue sky and clouds outside, sunglasses, uniform, freedom' },
    { name: 'gothic_vampire_coffin', prompt: 'masterpiece, best quality, beautiful vampire sleeping in coffin, red velvet lining, black lace dress, roses, crypt setting, pale skin' },
    { name: 'cheerleader_stadium', prompt: 'masterpiece, best quality, beautiful cheerleader, pom poms, high jump, sports stadium background, blue sky, energetic, dynamic angle' },
    { name: 'post_apoc_scavenger', prompt: 'masterpiece, best quality, beautiful scavenger girl, backpack, ruins of city, overgrown with plants, sunset, hopeful expression' },
    { name: 'christmas_santa_girl', prompt: 'masterpiece, best quality, beautiful santa girl, holding gift, snowy street, christmas lights, warm breath, festive atmosphere' },
    { name: 'battle_nun_gun', prompt: 'masterpiece, best quality, beautiful warrior nun, habit torn, dual pistols, muzzle flash, stained glass church background, holy action' },
    { name: 'egyptian_queen_nile', prompt: 'masterpiece, best quality, beautiful egyptian queen, gold jewelry, white linen, nile river background, pyramids, ancient splendor' },
    { name: 'racing_miku_style', prompt: 'masterpiece, best quality, beautiful futuristic racer, parasol, digital circuit track, bright teal and white, speed lines, mascot' },
    { name: 'phantom_thief_night', prompt: 'masterpiece, best quality, beautiful phantom thief girl, mask, holding jewel, jumping off building, police lights below, city night' },
    { name: 'glass_sculpture_girl', prompt: 'masterpiece, best quality, beautiful girl made of stained glass, light shining through, colorful refraction, abstract garden, fragile beauty' },
    { name: 'demon_huntress_horns', prompt: 'masterpiece, best quality, beautiful demon huntress, curved horns, glowing red tattoos, dark forest, moonlight, fierce warrior' },
    { name: 'cafe_date_window', prompt: 'masterpiece, best quality, beautiful girl on date, coffee shop, window seat, looking at viewer, latte art, warm lighting, romantic' },
    { name: 'snow_magic_caster', prompt: 'masterpiece, best quality, beautiful snow mage, casting spell, snowflake magic circle, winter forest, white fur cloak, glowing blue' },
    { name: 'desert_warrior_scimitar', prompt: 'masterpiece, best quality, beautiful desert warrior, scimitar, turban, sandstorm, ancient ruins background, fierce eyes' },
    { name: 'idol_backstage_mirror', prompt: 'masterpiece, best quality, beautiful idol girl, looking in vanity mirror, applying makeup, backstage dressing room, lights, pensive' },
    { name: 'flower_field_running', prompt: 'masterpiece, best quality, beautiful girl running through flower field, white dress, petals flying, blue sky, wide shot, freedom' },
    { name: 'clockwork_doll_key', prompt: 'masterpiece, best quality, beautiful clockwork doll, wind-up key on back, porcelain joints, antique shop, dust and shadows, melancholy' },
    { name: 'volleyball_spike_beach', prompt: 'masterpiece, best quality, beautiful beach volleyball player, spiking ball, sand flying, ocean background, sun flare, summer energy' },
    { name: 'medusa_gorgon_stone', prompt: 'masterpiece, best quality, beautiful medusa, snake hair, stone statues background, greek temple, glowing green eyes, mystical dangerous' },
    { name: 'cyber_sniper_roof', prompt: 'masterpiece, best quality, beautiful cyberpunk sniper, lying on rooftop, neon city rain, futuristic rifle, hud interface, cool vibes' },
    { name: 'forest_witch_hut', prompt: 'masterpiece, best quality, beautiful cottagecore witch, drying herbs, wooden hut, black cat, sunlight filtering, peaceful life' },
    { name: 'princess_balcony_night', prompt: 'masterpiece, best quality, beautiful princess, leaning on balcony, looking at castle town night, stars, elegant gown, longing' },
    { name: 'sword_maiden_blindfold', prompt: 'masterpiece, best quality, beautiful sword maiden, blindfolded, white robes, holding scale and sword, justice symbolism, marble hall' },
    { name: 'rainy_bus_stop_waiting', prompt: 'masterpiece, best quality, beautiful girl waiting at bus stop, holding clear umbrella, rain falling, street lights reflection, lo-fi mood' },
    { name: 'succubus_bar_singer', prompt: 'masterpiece, best quality, beautiful jazz singer succubus, microphone, smoky bar, red dress, horns, spot light, sultry atmosphere' },
    { name: 'kitsune_wedding_rain', prompt: 'masterpiece, best quality, beautiful kitsune bride, fox wedding, sun shower, traditional kimono, forest path, mystical spirits' },
    { name: 'dragon_rider_sky', prompt: 'masterpiece, best quality, beautiful dragon rider, flying high in clouds, goggles, leather gear, wind blowing, epic adventure' },
    { name: 'time_traveler_clock', prompt: 'masterpiece, best quality, beautiful time traveler, standing on giant clock face, time vortex, steampunk gear, hourglass, surreal' },
    { name: 'candy_kingdom_girl', prompt: 'masterpiece, best quality, beautiful candy girl, dress made of sweets, lollipop forest, chocolate river, pastel colors, cute fantasy' },
    { name: 'ghost_ship_captain', prompt: 'masterpiece, best quality, beautiful ghost captain, spectral pirate ship, green fog, translucent body, tricorne hat, eerie beauty' }
];

async function generateImage(modelId, item, index, outputDir) {
    const filename = `${item.name}.png`;
    const filePath = path.join(outputDir, filename);

    // Skip if exists to save time/cost during dev (optional, remove check for full regen)
    if (fs.existsSync(filePath)) return `/showcase/${modelId}/${filename}`;

    console.log(`   [${modelId}] [${index + 1}/${PROMPTS.length}] Generating: ${item.name}...`);

    const params = new URLSearchParams({
        prompt: item.prompt,
        model: modelId,
        steps: '30',
        cfg: '7.5',
        width: '1024',
        height: '1024',
        scheduler: 'DPM++ 2M Karras'
    });

    const url = `https://cardsorting--sdxl-multi-model-model-web-inference.modal.run?${params.toString()}`;


    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                // If model not supported or error, just reject
                reject(new Error(`API Error: ${res.statusCode}`));
                return;
            }

            const stream = fs.createWriteStream(filePath);
            res.pipe(stream);

            stream.on('finish', () => {
                stream.close();
                console.log(`      ✓ Saved to ${filename}`);
                resolve(`/showcase/${modelId}/${filename}`);
            });
        }).on('error', reject);
    });
}

async function processModel(modelId) {
    console.log(`\n=== Processing Model: ${modelId} ===`);
    const outputDir = path.join(BASE_OUTPUT_DIR, modelId);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const manifestPath = path.join(outputDir, 'manifest.json');
    const webPaths = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        try {
            const webPath = await generateImage(modelId, PROMPTS[i], i, outputDir);
            webPaths.push({
                url: webPath,
                name: PROMPTS[i].name,
                prompt: PROMPTS[i].prompt
            });
        } catch (error) {
            console.error(`      ✗ Failed: ${error.message}`);
        }
    }

    if (webPaths.length > 0) {
        fs.writeFileSync(manifestPath, JSON.stringify(webPaths, null, 2));
        console.log(`   ✓ Manifest saved for ${modelId}`);
    } else {
        console.log(`   ! No images generated for ${modelId}`);
    }
}

async function main() {
    console.log(`Starting Batch Showcase Generation for ${MODELS.length} models...`);

    for (const modelId of MODELS) {
        await processModel(modelId);
    }

    console.log('\n✓ All models processed.');
}

main();
