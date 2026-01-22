// scripts/generate_zit_showcase.cjs
const fs = require('fs');
const path = require('path');
const { uploadToB2 } = require('./utils/b2_uploader.cjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const TARGET_DIR = path.join(__dirname, '../public/showcase/zit-model');
const MANIFEST_PATH = path.join(TARGET_DIR, 'manifest.json');
const BASE_URL = "https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run";
const B2_PUBLIC_URL = process.env.VITE_B2_PUBLIC_URL || 'https://cdn.dreambeesai.com';
const B2_BUCKET = process.env.VITE_B2_BUCKET || 'printeregg';

const PROMPTS = [
    "hyper-realistic portrait of an obsessively handsome dark prince with silver hair and piercing violet eyes, wearing intricate obsidian armor, dramatic cinematic lighting, intoxicatingly beautiful, 8k resolution",
    "stunning fae lord with golden skin and mesmerizing amber eyes, long flowing white hair, wearing a robe of woven moonlight, ethereal and seductive, cinematic masterpiece",
    "immensely handsome dragon shifter with heterochromia (one gold, one blue eye), sharp jawline, wearing dragon-scale leather armor, fiery background, intense and alluring",
    "deeply intimate portrait of a brooding sorcerer with dark curls and soul-piercing grey eyes, glowing magic runes on his skin, soft candlelight, intoxicatingly handsome",
    "ethereal warrior with translucent skin and glowing blue eyes, silver wings, wearing white silk and silver armor, celestial and seductive beauty",
    "portrait of a breathtakingly handsome pirate king with windswept dark hair and a smirking gaze, wearing a velvet captain's coat, tropical sunset lighting, alluring and fierce",
    "intoxicatingly handsome elven king with delicate features and emerald green eyes, wearing a crown of golden leaves, soft forest dappled light, hyper-detailed",
    "immensely handsome underworld deity with obsidian skin and glowing red eyes, wearing a cloak of shadows, dramatic high-contrast lighting, seductive and powerful",
    "stunning celestial knight with hair like liquid gold and eyes like clear blue diamonds, wearing shining silver armor, soft heavenly lighting, ethereal and intoxicating",
    "obsessively handsome shadow assassin with a mysterious gaze, silver-grey hair, wearing sleek black leather, rainy moonlit rooftop background, cinematic and seductive",
    "deeply intimate portrait of a weary paladin with a kind but intense gaze, golden hair, armor reflecting a warm sunrise, intoxicatingly handsome and noble",
    "intoxicating beauty of a merman prince with iridescent scales and turquoise eyes, floating underwater with light rays, mesmerizing and seductive",
    "stunningly handsome ancient vampire with porcelain skin and deep crimson eyes, wearing a Victorian high-fashion suit, gothic library background, alluring and haunting",
    "immensely handsome storm god with hair made of clouds and lightning eyes, wearing a toga of woven wind, dramatic sky background, majestic and seductive",
    "obsessively handsome forest guardian with bark-like patterns on his skin and glowing green eyes, wearing nothing but woven vines, soft magical glow, intoxicating",
    "intoxicating portrait of a handsome rogue with a charming smile and mischievous hazel eyes, wearing a leather doublet, dim tavern lighting, seductive and alluring",
    "stunningly handsome moon priest with silver stardust on his skin and crescent moon markings, wearing white silk robes, cold night sky background, ethereal",
    "immensely handsome ice giant with skin like frozen marble and eyes like blue ice, wearing fur and bone armor, snowstorm background, powerful and seductive",
    "obsessively handsome sun king with hair like flames and eyes like molten gold, wearing a robe of woven sunlight, desert oasis at noon, majestic and intoxicating",
    "deeply intimate portrait of a quiet scholar with long dark hair and intense blue eyes, surrounded by glowing holographic books, soft cinematic shadows, alluring",
    "intoxicatingly handsome knight of the round table aesthetic, silver hair, heavy plate armor reflecting roses, soft morning light, romantic and seductive",
    "stunningly handsome phoenix shifter with hair of shifting reds and oranges, glowing amber eyes, wearing bronze silk, volcanic background, mesmerizing",
    "immensely handsome sea captain with a rugged look and oceanic blue eyes, sun-kissed skin, wearing a linen shirt on a windswept deck, seductive and brave",
    "obsessively handsome dark sorcerer with a cold, haughty gaze and long silver hair, wearing black velvet robes, dramatic throne room, intoxicatingly alluring",
    "intoxicating portrait of a handsome nomadic prince with exotic features and deep gold eyes, wearing traditional silk and jewelry, desert sunset, majestic",
    "stunningly handsome ethereal being made of stars and nebulae, glowing eyes, mysterious void background, breathtakingly seductive and beautiful",
    "immensely handsome gargoyle shifter with stone-like skin and glowing violet eyes, wings spread wide over a rainy gothic city, dramatic and alluring",
    "obsessively handsome fae trickster with a mischievous gaze and silver hair with leaf accents, wearing a dress of woven petals, soft twilight lighting, seductive",
    "intoxicating beauty of a handsome monk with a peaceful but intense gaze, wearing saffron robes, ancient temple background, soft golden light, alluring",
    "stunningly handsome futuristic pilot with a sleek flight suit and glowing HUD visor reflections, cockpit lighting, sharp and seductive aesthetic",
    "immensely handsome gladiator with a battle-scarred but beautiful face and sapphire eyes, wearing bronze armor, arena sunset lighting, seductive and fierce",
    "obsessively handsome mountain king with hair like granite and eyes like emeralds, wearing a crown of raw gems, ancient throne room, majestic and intoxicating",
    "intoxicating portrait of a handsome bard with melodic gold eyes and long dark curls, holding a silver lute, soft spotlight lighting, seductive and mesmerizing",
    "stunningly handsome star-born prince with silver skin and eyes like galaxies, wearing a cloak of dark matter, celestial background, ethereal and alluring",
    "immensely handsome werewolf alpha with a rugged look and glowing amber eyes, wearing torn clothes in a moonlit forest, powerful and seductive presence",
    "obsessively handsome high-fashion mage with a sharp jawline and icy blue eyes, wearing structured white silk with gold embroidery, clean and intoxicating",
    "intoxicating beauty of a handsome nomad king with deep brown skin and eyes like honey, wearing intricate gold jewelry and silk, desert night, regal",
    "deeply intimate portrait of a handsome alchemist with messy hair and intense green eyes, surrounded by glowing neon fluids, soft moody lighting, seductive",
    "stunningly handsome celestial architect with hair of liquid silver and eyes like diamonds, wearing robes of light, heavenly city background, ethereal",
    "immensely handsome shadow prince with obsidian wings and glowing red eyes, wearing a suit of dark velvet, misty graveyard background, alluring and haunting",
    "obsessively handsome samurai with a stoic gaze and long dark hair, wearing traditional silk and steel armor, cherry blossom petals falling, cinematic",
    "intoxicating portrait of a handsome dream-weaver with hair like mist and eyes like shifting pearls, wearing robes of woven clouds, ethereal and seductive",
    "stunningly handsome high-fashion vamp king with sharp features and violet eyes, wearing a black silk robe, opulent palace background, dramatic and alluring",
    "immensely handsome wind-spirit with translucent skin and eyes like clear sky, flying through a golden sunset, soft and intoxicatingly beautiful",
    "obsessively handsome iron-smith with a muscular build and smoldering amber eyes, wearing a leather apron, sparks flying in a dark forge, seductive and powerful",
    "intoxicating beauty of a handsome cosmic entity with skin like a nebula and glowing stars for eyes, breathtaking and seductive presence in the void",
    "stunningly handsome knight of the sun with golden armor and hair like light, standing on a white marble balcony, bright ethereal lighting, majestic",
    "immensely handsome dark elf prince with lavender skin and silver hair, wearing ebony armor, bioluminescent forest background, mysterious and seductive",
    "obsessively handsome high-fashion editor aesthetic with a cold, intelligent gaze and sharp suit, minimalist office, seductive and sophisticated",
    "deeply intimate portrait of a handsome gardener with sun-kissed skin and warm brown eyes, surrounded by intoxicatingly beautiful flowers, soft focus",
    "intoxicating portrait of a handsome dark prince with silver hair and a deeply intimate gaze, eyes like molten gold, soft cinematic shadows, alluring, 8k resolution",
    "stunning fae warrior with a captivating gaze, lounging in an enchanted forest, moonlight filtering through leaves, seductive atmosphere, hyper-detailed",
    "immensely alluring man with obsidian hair and piercing emerald eyes, a dazzling gaze that feels like a siren call, high-fashion fantasy aesthetic, cinematic lighting",
    "obsessively handsome man with a soft, seducing smile, wearing a sheer silk robe, candlelit chamber with deep shadows, intimate and intoxicating",
    "ethereal lord with a mesmerizing gaze, skin shimmering like stardust, wearing nothing but liquid silver jewelry, celestial and allure-heavy",
    "portrait of a breathtakingly handsome man with a sultry gaze, dark velvet background, dramatic lighting, seductive and intoxicating beauty",
    "intoxicatingly alluring warrior in a rain-slicked medieval city, a dazzling gaze through the mist, high-fashion leather armor, cinematic and seductive",
    "immensely handsome man with a deep, intimate expression, soft focus, warm sunset light hitting his sharp jawline, captivating and soul-piercing",
    "stunning siren-call aesthetic for men, a man with mesmerizing blue eyes and wet hair, emerging from dark water at midnight, moonlight, seductive and ethereal",
    "obsessively handsome prince with a dazzling gaze, wearing a backless silk tunic, intricate gold necklace, high-end fantasy editorial, intoxicating allure",
    "deeply intimate portrait of a man with a soft, seductive gaze, messy curls, oversized white shirt, natural morning light, captivatingly handsome",
    "intoxicating beauty with a hypnotic gaze, wearing a heavy crown of obsidian, dark moody lighting, regal and seducing presence, hyper-detailed",
    "stunningly handsome lord with a gaze that dazzles, wearing a robe made of light and shadow, futuristic and seductive, cinematic masterpiece",
    "immensely handsome man with a siren-call aesthetic, long flowing white hair, golden eyes, wind-swept cliff at dusk, mesmerizing and alluring",
    "obsessively handsome man with a deeply intimate and seductive look, wearing a sheer black silk shirt, low-key lighting, intoxicating atmosphere",
    "intoxicatingly handsome man with a captivating gaze, wearing a choker of silver and sapphire, dark lips, noir fantasy aesthetic, sultry and dazzling",
    "stunningly alluring man with a gaze like a siren's call, wearing a cloak of woven starlight, ethereal and deeply seductive beauty",
    "immensely handsome man with a soft, intimate smile, lying in a field of poisonous flowers, soft moonlight, captivating and intoxicating",
    "obsessively handsome man with a dazzling, soul-piercing gaze, wearing a high-fashion metallic armor-piece, sharp cinematic lighting, majestic and alluring",
    "deeply intimate portrait of a man with a seductive gaze, back-lit by a glowing magical orb, soft shadows, intoxicating and breathtaking",
    "intoxicatingly handsome merman with a captivating gaze, wearing a crown of coral and pearls, underwater aesthetic with light rays, mesmerizing",
    "stunningly alluring man with a gaze that dazzles, lounging in a vintage high-fantasy palace, soft morning glow, chic and seductive",
    "immensely handsome man with a siren-call look, wearing an intricate gold headpiece, deep amber eyes, desert sunset lighting, majestic",
    "obsessively handsome man with a deeply intimate expression, wearing a red silk tunic, dramatic shadows, intoxicating and alluring",
    "intoxicating beauty with a mesmerising gaze, wearing a high-fashion gown of transparent silver silk, studio lighting, sharp and seductive",
    "stunningly alluring man with a gaze like a siren's call, wind-swept hair, leather and silk fashion, urban fantasy rooftop at night, cinematic",
    "immensely handsome man with a soul-dazzling gaze, wearing a suit of liquid silver, futuristic fantasy and intoxicatingly seductive",
    "obsessively handsome man with a deeply intimate and alluring look, soft cinematic lighting, porcelain skin, mesmerizing and captivating",
    "intoxicatingly handsome man with a seductive gaze, ruby red lips, wearing a vintage silk shirt, noir fantasy ballroom background, dazzling",
    "stunningly alluring siren-man aesthetic, man with glowing skin and mesmerizing eyes, ethereal lighting, underwater dreamscape, captivating",
    "immensely handsome man with a gaze that dazzles, wearing a high-fashion robe of iridescent silk, sunset clouds background, intoxicating",
    "obsessively handsome man with a deeply intimate and seductive expression, messy bed setting, soft morning light, natural and alluring",
    "intoxicatingly handsome man with a soul-piercing gaze, wearing a crown of jewels and thorns, dark gothic fantasy aesthetic, mesmerizing",
    "stunningly alluring man with a gaze like a siren's call, wearing a tunic of woven gold, desert oasis at dusk, majestic and seductive",
    "immensely handsome man with a deeply intimate look, soft focus, candlelit dinner in an ancient castle, romantic and intoxicatingly alluring",
    "obsessively handsome man with a dazzling gaze, wearing a high-fashion white silk robe, minimalist architectural background, sharp and captivating",
    "intoxicating beauty with a seductive gaze, wearing a sheer veil of black lace over his eyes, soft moody lighting, noir aesthetic, sultry and mesmerizing",
    "stunningly alluring man with a gaze that dazzles, emerging from a sea of golden mist, heavenly lighting, ethereal and intoxicating",
    "immensely handsome man with a soul-captivating gaze, wearing a tunic of dragon silk, lush garden background, vibrant and seductive",
    "obsessively handsome man with a deeply intimate and alluring look, wearing a backless velvet tunic, dramatic museum lighting, majestic",
    "intoxicatingly handsome man with a seductive gaze, wearing a choker of black diamonds, soft cinematic shadows, high-fashion editorial, dazzling",
    "stunningly alluring man with a gaze like a siren's call, wearing a suit of liquid mercury, futuristic fantasy city skyline at night, cinematic",
    "immensely handsome man with a soul-dazzling gaze, soft focus, field of magical flowers at sunset, dreamy and intoxicatingly seductive",
    "obsessively handsome man with a deeply intimate and alluring look, wearing a vintage silk chemise, soft window light, natural and captivating",
    "intoxicatingly handsome man with a seductive gaze, wearing a crown of silver and moonstones, ethereal night forest background, mesmerizing",
    "stunningly alluring lord with a gaze that dazzles, lounging on a obsidian throne, opulent palace background, regal and seductive",
    "immensely handsome man with a soul-captivating gaze, wearing a tunic of woven light, dark void background, sharp and intoxicating",
    "obsessively handsome man with a deeply intimate and alluring expression, soft focus, rain-drenched ancient castle window, moody and seductive",
    "intoxicatingly handsome man with a seductive gaze, wearing a high-fashion cloak of black feathers, dramatic magical opera house lighting, dazzling",
    "stunningly alluring man with a gaze like a siren's call, wearing a suit of liquid starlight, cosmic nebula background, ethereal and captivating",
    "hyper-realistic close-up of a handsome fae prince with iridescent eyes and a crown of black thorns, wearing nothing but draped silver chains, soft moonlight, intoxicating",
    "obsessively handsome shadow lord with a sharp jawline and ink-black eyes, wearing a sheer silk robe, surrounded by swirling dark smoke, seductive and intimate",
    "immensely handsome fire deity with glowing orange eyes and hair like embers, wearing bronze leather armor, volcanic sunset lighting, intense and alluring gaze",
    "stunning frost lord with skin like white marble and crystalline blue eyes, wearing flowing translucent robes, snow-covered forest background, ethereal and seductive",
    "deeply intimate portrait of a handsome dragon king with vertical slit pupils and gold-flecked skin, wearing a rich velvet cloak, treasure hoard background, intoxicating",
    "intoxicatingly handsome solar deity with hair like radiant light and eyes like molten suns, wearing gold-threaded silk, ancient marble temple background, majestic",
    "stunningly alluring celestial warrior with six wings of pure light and a piercing silver gaze, wearing white armor, clouds at dusk background, ethereal beauty",
    "obsessively handsome rogue assassin with a smirking gaze and sapphire eyes, wearing high-fashion black leather and lace, rainy neon fantasy alleyway, seductive",
    "immensely handsome elven druid with long emerald hair and moss-green eyes, wearing nothing but intricate bark tattoos, soft forest glow, deeply intimate",
    "deeply intimate portrait of a brooding warlock with dark curls and violet eyes, glowing glyphs on his chest, soft purple candlelight, intoxicatingly handsome",
    "stunningly handsome merman king with bioluminescent markings and deep oceanic eyes, floating in a coral palace, light rays from above, captivating and seductive",
    "intoxicating beauty of a handsome vampire count with porcelain skin and hypnotic red eyes, wearing a high-collared black silk coat, gothic library, alluring",
    "immensely handsome storm god with wild silver hair and eyes of crackling lightning, wearing a sheer grey tunic, dramatic dark clouds, powerful and seductive",
    "obsessively handsome guardian of the underworld with obsidian skin and glowing golden eyes, wearing a crown of bone and silver, majestic and intoxicating",
    "intoxicating portrait of a handsome desert prince with exotic features and amber eyes, wearing a sheer indigo silk wrap, golden sand dunes at sunset, seductive",
    "stunningly handsome moon spirit with silver stardust on his skin and eyes like pearls, wearing white velvet, starry night background, ethereal and alluring",
    "immensely handsome knight of the abyss with dark armor and glowing violet eyes, standing in a field of glass flowers, dramatic lighting, seductive and mysterious",
    "obsessively handsome sun-born warrior with bronze skin and eyes like topaz, wearing golden armor reflecting the dawn, majestic and intoxicating gaze",
    "deeply intimate portrait of a quiet alchemist with long platinum hair and intense blue eyes, wearing a black silk vest, glowing vapors, alluring and sophisticated",
    "intoxicatingly handsome knight of the silver rose, long white hair, silver armor covered in floral engraving, soft morning light, romantic and seductive",
    "stunningly handsome phoenix lord with shifting red-gold hair and mesmerizing orange eyes, wearing silk robes that appear to be burning, volcanic glow",
    "immensely handsome high-fashion mage with a sharp jawline and icy grey eyes, wearing a structured midnight-blue velvet suit, clean and intoxicating aesthetic",
    "obsessively handsome dark elf assassin with charcoal skin and white hair, wearing sleek leather and onyx jewelry, bioluminescent cave background, seductive",
    "intoxicating portrait of a handsome nomadic king with deep bronze skin and eyes like emeralds, wearing a heavy gold torque, desert night sky, regal and alluring",
    "stunningly handsome ethereal being made of starlight and shadow, translucent skin, mysterious void background, breathtakingly seductive presence",
    "immensely handsome sea deity with rugged features and turquoise eyes, wet skin glistening, emerging from dark waves at night, seductive and powerful",
    "obsessively handsome fae trickster with wild silver hair and a mischievous, soul-piercing gaze, wearing a tunic of woven leaves, soft twilight, intoxicating",
    "intoxicating beauty of a handsome monk with a peaceful but intense gold gaze, wearing sheer white robes, ancient temple background, soft light, alluring",
    "stunningly handsome futuristic guardian with a sleek black suit and glowing blue HUD reflections, cyberpunk fantasy aesthetic, sharp and seductive",
    "immensely handsome gladiator prince with a battle-scarred but beautiful face and sapphire eyes, wearing bronze silk ribbons, arena sunset, seductive",
    "obsessively handsome star-born voyager with silver skin and eyes like galaxies, wearing a cloak of dark velvet, celestial nebula background, ethereal",
    "intoxicating portrait of a handsome bard with melodic amber eyes and long dark waves, wearing a silk shirt open to the waist, soft spotlight, seductive",
    "stunningly handsome high-fashion vamp lord with sharp features and violet eyes, wearing a deep red silk robe, opulent ballroom, dramatic and alluring",
    "immensely handsome wind spirit with translucent skin and eyes like the clear sky, floating above a golden autumn forest, soft and intoxicatingly beautiful",
    "obsessively handsome grandmaster mage with a cold, intelligent gaze and long silver hair, wearing dark velvet and gold embroidery, majestic and intoxicating",
    "intoxicatingly handsome dark paladin with silver hair and eyes like molten gold, wearing heavy black plate armor, soft cinematic shadows, alluring and powerful",
    "deeply intimate portrait of a handsome stargazer with messy dark hair and intense grey eyes, skin dusted with silver, soft cosmic lighting, seductive",
    "stunningly handsome celestial smith with skin like bronze and eyes like fire, wearing a leather apron and silver chains, sparks in the dark, powerful beauty",
    "immensely handsome shadow dancer with obsidian skin and glowing violet eyes, wearing nothing but sheer silk veils, mysterious and seductive aesthetic",
    "obsessively handsome high-fashion samurai with a stoic gaze and long dark hair, wearing traditional silk in vibrant red, cherry blossom night, cinematic",
    "intoxicating portrait of a handsome dream-walker with hair like white mist and eyes like shifting opals, wearing robes of woven clouds, ethereal and seductive",
    "stunningly handsome knight of the lunar moon, silver-white hair, skin shimmering, wearing white armor with sapphire accents, celestial and alluring",
    "immensely handsome mountain deity with rugged features and emerald eyes, wearing fur and raw emeralds, ancient stone throne, majestic and seductive",
    "obsessively handsome futuristic pilot with a sharp jawline and glowing visor reflections, neon city background, sharp and seductive high-fashion look",
    "intoxicating beauty of a handsome cosmic architect with skin like a dark nebula and glowing stars for eyes, breathtaking and seductive in the void",
    "stunningly handsome lord of the silver tide, long flowing white hair, blue eyes, wearing robes of semi-transparent silk, shoreline at dusk, ethereal",
    "immensely handsome dark prince with lavender skin and silver hair, wearing ebony armor, bioluminescent garden, mysterious and intoxicatingly beautiful",
    "obsessively handsome high-fashion rebel with a cold, rebellious gaze and sharp black suit, minimalist industrial background, seductive and sophisticated",
    "deeply intimate portrait of a handsome prince with sun-kissed skin and warm amber eyes, wearing a simple white silk shirt, field of sunflowers, radiant",
    "intoxicating portrait of a handsome fae king with long silver hair and mesmerizing violet eyes, wearing a crown of crystal, ethereal forest at twilight",
    "stunningly alluring man with a gaze like a siren's call, wearing a robe of woven sunlight, desert oasis at golden hour, majestic and seductive",
    "immensely handsome dark sorcerer with a brooding look and soul-piercing grey eyes, wearing black velvet and leather, glowing ruins, intoxicating",
    "obsessively handsome warrior with a fierce gaze and sapphire eyes, wearing high-fashion bronze armor, dramatic stormy sky background, seductive and bold",
    "ethereal lord with a mesmerizing gaze, skin shimmering like stardust, wearing nothing but liquid gold jewelry, celestial and allure-heavy",
    "portrait of a breathtakingly handsome man with a sultry gaze, dark velvet background, dramatic lighting, seductive and intoxicating beauty",
    "intoxicatingly alluring warrior in a rain-slicked medieval city, a dazzling gaze through the mist, high-fashion leather armor, cinematic and seductive",
    "immensely handsome man with a deep, intimate expression, soft focus, warm sunset light hitting his sharp jawline, captivating and soul-piercing",
    "stunning siren-call aesthetic for men, a man with mesmerizing blue eyes and wet hair, emerging from dark water at midnight, moonlight, seductive and ethereal",
    "obsessively handsome prince with a dazzling gaze, wearing a backless silk tunic, intricate gold necklace, high-end fantasy editorial, intoxicating allure",
    "deeply intimate portrait of a man with a soft, seductive gaze, messy curls, oversized white shirt, natural morning light, captivatingly handsome",
    "intoxicating beauty with a hypnotic gaze, wearing a heavy crown of obsidian, dark moody lighting, regal and seducing presence, hyper-detailed",
    "stunningly handsome lord with a gaze that dazzles, wearing a robe made of light and shadow, futuristic and seductive, cinematic masterpiece",
    "immensely handsome man with a siren-call aesthetic, long flowing white hair, golden eyes, wind-swept cliff at dusk, mesmerizing and alluring",
    "obsessively handsome man with a deeply intimate and seductive look, wearing a sheer black silk shirt, low-key lighting, intoxicating atmosphere",
    "intoxicatingly handsome man with a captivating gaze, wearing a choker of silver and sapphire, dark lips, noir fantasy aesthetic, sultry and dazzling",
    "stunningly alluring man with a gaze like a siren's call, wearing a cloak of woven starlight, ethereal and deeply seductive beauty",
    "immensely handsome man with a soft, intimate smile, lying in a field of poisonous flowers, soft moonlight, captivating and intoxicating",
    "obsessively handsome man with a dazzling, soul-piercing gaze, wearing a high-fashion metallic armor-piece, sharp cinematic lighting, majestic and alluring",
    "deeply intimate portrait of a man with a seductive gaze, back-lit by a glowing magical orb, soft shadows, intoxicating and breathtaking",
    "intoxicatingly handsome merman with a captivating gaze, wearing a crown of coral and pearls, underwater aesthetic with light rays, mesmerizing",
    "stunningly alluring man with a gaze that dazzles, lounging in a vintage high-fantasy palace, soft morning glow, chic and seductive",
    "immensely handsome man with a siren-call look, wearing an intricate gold headpiece, deep amber eyes, desert sunset lighting, majestic",
    "obsessively handsome man with a deeply intimate expression, wearing a red silk tunic, dramatic shadows, intoxicating and alluring",
    "intoxicating beauty with a mesmerising gaze, wearing a high-fashion gown of transparent silver silk, studio lighting, sharp and seductive",
    "stunningly alluring man with a gaze like a siren's call, wind-swept hair, leather and silk fashion, urban fantasy rooftop at night, cinematic",
    "immensely handsome man with a soul-dazzling gaze, wearing a suit of liquid silver, futuristic fantasy and intoxicatingly seductive",
    "obsessively handsome man with a deeply intimate and alluring look, soft cinematic lighting, porcelain skin, mesmerizing and captivating",
    "intoxicatingly handsome man with a seductive gaze, ruby red lips, wearing a vintage silk shirt, noir fantasy ballroom background, dazzling",
    "stunningly alluring siren-man aesthetic, man with glowing skin and mesmerizing eyes, ethereal lighting, underwater dreamscape, captivating",
    "immensely handsome man with a gaze that dazzles, wearing a high-fashion robe of iridescent silk, sunset clouds background, intoxicating",
    "obsessively handsome man with a deeply intimate and seductive expression, messy bed setting, soft morning light, natural and alluring",
    "intoxicatingly handsome man with a soul-piercing gaze, wearing a crown of jewels and thorns, dark gothic fantasy aesthetic, mesmerizing",
    "stunningly alluring man with a gaze like a siren's call, wearing a tunic of woven gold, desert oasis at dusk, majestic and seductive",
    "immensely handsome man with a deeply intimate look, soft focus, candlelit dinner in an ancient castle, romantic and intoxicatingly alluring",
    "obsessively handsome man with a dazzling gaze, wearing a high-fashion white silk robe, minimalist architectural background, sharp and captivating",
    "intoxicating beauty with a seductive gaze, wearing a sheer veil of black lace over his eyes, soft moody lighting, noir aesthetic, sultry and mesmerizing",
    "stunningly alluring man with a gaze that dazzles, emerging from a sea of golden mist, heavenly lighting, ethereal and intoxicating",
    "immensely handsome man with a soul-captivating gaze, wearing a tunic of dragon silk, lush garden background, vibrant and seductive",
    "obsessively handsome man with a deeply intimate and alluring look, wearing a backless velvet tunic, dramatic museum lighting, majestic",
    "intoxicatingly handsome man with a seductive gaze, wearing a choker of black diamonds, soft cinematic shadows, high-fashion editorial, dazzling",
    "stunningly alluring man with a gaze like a siren's call, wearing a suit of liquid mercury, futuristic fantasy city skyline at night, cinematic",
    "immensely handsome man with a soul-dazzling gaze, soft focus, field of magical flowers at sunset, dreamy and intoxicatingly seductive",
    "obsessively handsome man with a deeply intimate and alluring look, wearing a vintage silk chemise, soft window light, natural and captivating",
    "intoxicatingly handsome man with a seductive gaze, wearing a crown of silver and moonstones, ethereal night forest background, mesmerizing",
    "stunningly alluring lord with a gaze that dazzles, lounging on a obsidian throne, opulent palace background, regal and seductive",
    "immensely handsome man with a soul-captivating gaze, wearing a tunic of woven light, dark void background, sharp and intoxicating",
    "obsessively handsome man with a deeply intimate and alluring expression, soft focus, rain-drenched ancient castle window, moody and seductive",
    "intoxicatingly handsome man with a seductive gaze, wearing a high-fashion cloak of black feathers, dramatic magical opera house lighting, dazzling",
    "stunningly alluring man with a gaze like a siren's call, wearing a suit of liquid starlight, cosmic nebula background, ethereal and captivating",
    "hyper-realistic portrait of an immensely handsome shadow king with long obsidian hair and glowing amber eyes, wearing a cloak of feathers and silver, night-blooming garden, intoxicating",
    "stunningly handsome knight of the fallen star, silver hair with blue streaks, wearing shattered obsidian armor that glows with inner light, celestial and seductive",
    "intoxicating portrait of a high-fashion necromancer with pale skin and glowing emerald eyes, wearing black silk and bones, dramatic studio lighting",
    "obsessively handsome ethereal clockmaker with eyes like clockwork gears, long golden hair, surrounded by floating metallic butterflies, soft magical glow",
    "immensely handsome void-born prince with skin like the night sky and white hair, wearing a suit of dark matter, cosmic background, seductive and mysterious",
    "stunningly alluring crystal cave guardian with sapphire skin and eyes like diamonds, wearing nothing but draped translucent jewels, glowing bioluminescence",
    "intoxicating beauty of a nomadic wind-walker with sun-kissed skin and sky-blue eyes, hair flowing like mist, wearing tattered white silk, desert at twilight",
    "obsessively handsome celestial blacksmith with hair like molten silver and eyes of fire, wearing a leather apron over bronze skin, sparks flying in a dark forge",
    "immensely handsome obsidian-winged angel with a sharp jawline and violet eyes, wearing silver chains, standing in a field of white roses, dramatic lighting",
    "stunning portrait of a silver-haired oracle with a hauntingly beautiful gaze, glowing runes on his torso, wearing sheer white robes, ethereal and provocative",
    "intoxicatingly handsome gothic architect with dark features and intense grey eyes, standing amidst towering stone arches at midnight, rain-slicked skin",
    "obsessively handsome bioluminescent sea king with iridescent scales and glowing green eyes, floating in deep ocean trenches with light rays, mesmerizing",
    "immensely handsome solar flare warrior with hair of orange light and gold-flecked eyes, wearing radiant solar armor, sun-drenched desert background",
    "stunningly alluring mist-shrouded duelist with a sharp, dangerous gaze, silver hair, wearing high-fashion leather and lace, moonlit castle balcony",
    "intoxicating beauty of an ancient dryad king with bark-patterned skin and amber eyes, crown of golden leaves, mossy forest lighting, seductive and earthy",
    "obsessively handsome high-fashion hacker-mage with glowing digital tattoos, wearing a sleek black bodysuit, neon data streams flowing around him",
    "immensely handsome celestial cartographer with eyes like galaxies, long stardust hair, surrounded by glowing astronomical charts, ethereal and alluring",
    "stunning portrait of a shadow-weaving tailor with dark, elegant features, weaving cloth from literal smoke, soft moody lighting, seductive and mysterious",
    "intoxicatingly handsome emerald-eyed serpent shifter with iridescent skin and a hypnotic gaze, lounging on velvet cushions, opulent palace setting",
    "obsessively handsome frozen wasteland king with skin like ice and crystalline hair, wearing heavy fur and silver jewelry, aurora borealis background",
    "immensely handsome golden-masked masquerade lord with a piercing gaze behind a filigree mask, wearing dark velvet and lace, candlelight and shadows",
    "stunningly alluring ethereal silk merchant with silver-gold hair and violet eyes, draped in shimmering exotic fabrics, vibrant sunset marketplace",
    "intoxicating beauty of a storm-chasing sorcerer with wild grey hair and crackling lightning eyes, wearing a tattered cloak, dramatic stormy sky",
    "obsessively handsome moon-dusted traveler with silver skin and pearl-white hair, wearing nomadic gear made of celestial silk, starry night background",
    "immensely handsome high-fashion dragon priest with bronze skin and vertical gold pupils, wearing ornate scale-embossed silk, ancient temple ruins",
    "stunning portrait of a celestial judge with flaming eyes and long white hair, wearing robes of pure light, standing in a marble void, majestic and seductive",
    "intoxicatingly handsome shadow-bound monk with a stoic but intense gaze, wearing tattered black robes, glowing purple energy around his hands",
    "obsessively handsome silver-tongued diplomat with sharp elven features and emerald eyes, wearing a high-collared velvet suit, opulent ballroom",
    "immensely handsome ethereal gardener with sun-kissed skin and eyes like poisonous flowers, surrounded by intoxicatingly beautiful toxic blooms",
    "stunningly alluring icy-veined winter warlock with translucent skin and blue-white hair, wearing crystalline armor, snow-covered forest at dusk",
    "intoxicating beauty of a star-gazing desert nomad with deep gold skin and eyes like honey, wearing elaborate silver jewelry and indigo silk",
    "obsessively handsome bioluminescent deep-sea explorer with glowing markings on his chest and dark eyes, surrounded by glowing jellyfish, ethereal",
    "immensely handsome high-fashion ritualist with long dark hair and intense red eyes, standing in a circle of salt and candles, dramatic noir lighting",
    "stunning portrait of an intoxicatingly beautiful chimera shifter with heterochromia (one gold, one silver eye), wearing fur and bronze accessories",
    "intoxicatingly handsome celestial weaver of fate with hair like liquid silver and eyes like diamonds, weaving threads of light, ethereal void background",
    "obsessively handsome obsidian-skinned lava god with cracks of molten orange in his skin, glowing amber eyes, volcanic sunset background",
    "immensely handsome silver-winged messenger with a youthful, dazzling gaze, wearing nothing but a white silk wrap, celestial clouds at noon",
    "stunningly alluring ethereal protector of the lost library with ink-stained skin and wise blue eyes, surrounded by ancient glowing tomes",
    "intoxicating beauty of a high-fashion elven archer with sharp features and emerald eyes, wearing structured green velvet and leather, forest sunlight",
    "obsessively handsome shadow-cloaked spy with a mysterious gaze, silver-grey hair, wearing sleek black leather and neon accents, rainy rooftop",
    "immensely handsome centaur lord with a muscular human torso and flowing white hair, sapphire eyes, roaming a golden meadow at sunset",
    "stunning portrait of a celestial musician with skin like stardust, playing a harp made of light beams, ethereal heavenly lighting, mesmerizing",
    "intoxicatingly handsome star-born fugitive with glowing blue tattoos and a rebellious gaze, wearing tattered futuristic gear, asteroid belt background",
    "obsessively handsome high-fashion alchemist with liquid gold hair and intense green eyes, surrounded by glowing neon fluids, soft moody lighting",
    "immensely handsome ethereal captain of a ghost ship with translucent skin and silver-grey hair, wearing a tattered velvet coat, misty ocean at night",
    "stunningly alluring shadow-touched paladin with silver hair and glowing violet eyes, wearing heavy black armor with silver filigree, soft candlelight",
    "intoxicating beauty of a master of illusions with hair like shifting smoke and eyes like opals, wearing a suit of iridescent silk, dreamy atmosphere",
    "obsessively handsome celestial engineer with bronze skin and hair like light, surrounded by floating golden gears and blueprints of light",
    "immensely handsome star-crossed lover with a melancholy but alluring gaze, stardust on his skin, wearing tattered silk, standing in a ruined palace",
    "stunning portrait of a high-fashion dark elf rogue with lavender skin and silver hair, wearing sleek leather and onyx jewelry, moonlit forest"
];


// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function generateAndSave(prompt, index) {
    console.log(`[${index + 1}/${PROMPTS.length}] Generating: "${prompt}"...`);

    // Using default aspect ratio 1:1 (1024x1024)
    const body = {
        prompt: prompt,
        steps: 9,
        width: 1024,
        height: 1024
    };

    try {
        // 1. Submit Job
        const submitResponse = await fetch(`${BASE_URL}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!submitResponse.ok) {
            throw new Error(`Submit API Error: ${submitResponse.statusText}`);
        }

        const submitJson = await submitResponse.json();
        const jobId = submitJson.job_id;
        console.log(`  Job submitted: ${jobId}. Polling...`);

        // 2. Poll for Result
        let buffer = null;
        for (let i = 0; i < 60; i++) { // 120 seconds max
            await new Promise(r => setTimeout(r, 2000));

            const resultRes = await fetch(`${BASE_URL}/result/${jobId}`);
            if (resultRes.status === 202) continue; // Still processing

            if (!resultRes.ok) {
                const errText = await resultRes.text();
                throw new Error(`Polling Error (${resultRes.status}): ${errText}`);
            }

            const ct = resultRes.headers.get('content-type');
            if (ct && ct.includes('image/')) {
                buffer = await resultRes.arrayBuffer();
                break;
            }

            const statusJson = await resultRes.json();
            if (statusJson.status === 'failed') {
                throw new Error(`Job Failed: ${statusJson.error}`);
            }
        }

        if (!buffer) throw new Error("Generation timed out");

        // Save first image specifically as 'cover.png' for the preview mode usage if index is 0
        const filename = index === 0 ? 'cover.png' : `${Date.now()}_${index}.png`;
        const b2Key = `showcase/zit-model/${filename}`;

        console.log(`  Uploading to B2: ${b2Key}...`);
        await uploadToB2(Buffer.from(buffer), b2Key, 'image/png');

        // Construct CDN URL (matching migrate_showcase_to_b2.cjs logic)
        let publicUrl;
        if (B2_PUBLIC_URL.includes('cdn.dreambeesai.com')) {
            publicUrl = `${B2_PUBLIC_URL.replace(/\/$/, '')}/file/${B2_BUCKET}/${b2Key}`;
        } else {
            publicUrl = `${B2_PUBLIC_URL}/${b2Key}`;
        }

        console.log(`  ✓ Uploaded: ${publicUrl}`);

        return {
            name: path.parse(filename).name,
            url: publicUrl,
            imageUrl: publicUrl,
            prompt: prompt,
            modelId: 'zit-model',
            creator: { user: 'Gemini 3 Pro', model: 'ZIT-model' } // metadata
        };
    } catch (err) {
        console.error(`  Failed: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("Starting ZIT Showcase Generation...");
    const manifest = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        const result = await generateAndSave(PROMPTS[i], i);
        if (result) {
            manifest.push(result);
        }
        // Small delay to be nice
        await new Promise(r => setTimeout(r, 1000));
    }

    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nDone! Manifest written to ${MANIFEST_PATH} with ${manifest.length} items.`);
}

run();
