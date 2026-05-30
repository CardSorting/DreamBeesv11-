import { logger } from "../lib/utils.js";

const MUTATION_KEYS = [
    "mythmaking",
    "melancholy",
    "absurdity",
    "grandeur",
    "intimacy",
    "decay",
    "ritual",
    "whimsy",
    "machinery",
    "mystery",
    "nostalgia",
    "satire",
    "wonder",
    "elegance",
    "danger",
] as const;

type TasteMutation = typeof MUTATION_KEYS[number];
type TasteVector = Record<TasteMutation, number>;
type DreamTrailMode = "balanced" | "dreamier" | "weirder" | "concept_art" | "print_ready" | "commercial";

type TasteGravity = {
    dominantAxes: TasteMutation[];
    suppressedAxes: TasteMutation[];
    recentTrajectory: TasteMutation[];
    noveltyPressure: number;
    coherencePressure: number;
};

type CadencePhase = "seed" | "build" | "twist" | "resolve";

type CadenceState = {
    acceptedCount: number;
    currentPhase: CadencePhase;
    phraseLengthBias: "short" | "medium";
    escalationLevel: number;
};

type DecisionNeed = "identity" | "setting" | "action" | "conflict" | "symbol" | "composition" | "tone";

type DecisionState = {
    missingNeeds: DecisionNeed[];
    strongestNeed: DecisionNeed;
    alreadySatisfied: DecisionNeed[];
};

type ArrivalMove = "continue" | "tighten" | "sharpen" | "generate";

type ArrivalState = {
    hasIdentity: boolean;
    hasAction: boolean;
    hasSetting: boolean;
    hasConflict: boolean;
    hasSymbol: boolean;
    readinessScore: number;
    nextBestMove: ArrivalMove;
};

type CreativeState = "blank" | "searching" | "exploring" | "committing" | "refining" | "finished";

type ConfidenceField = {
    directionConfidence: number;
    conceptConfidence: number;
    executionConfidence: number;
};

type ConfidenceMode = "low" | "medium" | "high";

type GhostAssertiveness = "subtle" | "normal" | "strong";

type InterventionReason = "hesitation" | "looping" | "branch_confusion" | "arrival" | "overloaded" | "none";

type InterventionState = {
    uncertaintyScore: number;
    attentionCost: number;
    expectedMomentumGain: number;
    interventionLevel: 0 | 1 | 2 | 3;
    reason: InterventionReason;
};

interface DreamTrailRequest {
    prompt?: unknown;
    acceptedHistory?: unknown;
    history?: unknown;
    tasteVector?: unknown;
    tasteGravity?: unknown;
    cadenceState?: unknown;
    decisionState?: unknown;
    arrivalState?: unknown;
    creativeState?: unknown;
    confidenceField?: unknown;
    interventionState?: unknown;
    taste?: unknown;
    mode?: unknown;
}

interface DreamTrailPayload {
    prompt: string;
    acceptedHistory: string[];
    tasteVector: TasteVector;
    tasteGravity: TasteGravity;
    cadenceState: CadenceState;
    decisionState: DecisionState;
    arrivalState: ArrivalState;
    creativeState: CreativeState;
    confidenceField: ConfidenceField;
    interventionState: InterventionState;
    mode: DreamTrailMode;
}

interface DreamTrailSuggestion {
    text: string;
    mutation: TasteMutation;
    decision?: DecisionNeed;
    score: number;
}

const MODES = new Set<DreamTrailMode>(["balanced", "dreamier", "weirder", "concept_art", "print_ready", "commercial"]);
const MUTATIONS = new Set<string>(MUTATION_KEYS);
const DECISION_KEYS: DecisionNeed[] = ["identity", "setting", "action", "conflict", "symbol", "composition", "tone"];
const ARRIVAL_THRESHOLD = 0.65;
const FINISHED_THRESHOLD = 0.86;
const HIGH_CONFIDENCE_THRESHOLD = 0.72;

const SYSTEM_PROMPT = `You are DreamTrail.

You generate short ghost-text continuations for image ideas.

You do not rewrite the prompt.
You do not explain.
You do not produce full prompts.
You do not mention AI, models, diffusion, or prompt engineering.

Your job is to suggest the next interesting mutation of the user's current idea.

Do not optimize for genre.
Do not optimize for generic quality tags.
Optimize for creative transformation.

Return JSON only.

Each suggestion must:
- start with a comma or connective phrase
- be 3-14 words
- be visually or narratively specific
- create forward motion
- map to exactly one mutation category
- map to exactly one creative decision

Mutation categories:
mythmaking, melancholy, absurdity, grandeur, intimacy, decay, ritual, whimsy, machinery, mystery, nostalgia, satire, wonder, elegance, danger.

Creative decision categories:
identity, setting, action, conflict, symbol, composition, tone.

Avoid:
masterpiece, best quality, 4k, 8k, ultra detailed, trending, award-winning, beautiful, nice, cool.

Return this shape:
{"suggestions":[{"text":", defending the last hive","mutation":"mythmaking","decision":"action","score":0.91}]}`;

const DEFAULT_TASTE_VECTOR: TasteVector = {
    mythmaking: 0.34,
    melancholy: 0.12,
    absurdity: 0.16,
    grandeur: 0.2,
    intimacy: 0.16,
    decay: 0.1,
    ritual: 0.2,
    whimsy: 0.38,
    machinery: 0.1,
    mystery: 0.24,
    nostalgia: 0.14,
    satire: 0.08,
    wonder: 0.45,
    elegance: 0.22,
    danger: 0.12,
};

const MODE_MUTATION_BIAS: Record<DreamTrailMode, TasteMutation[]> = {
    balanced: ["mythmaking", "wonder", "ritual", "mystery", "whimsy"],
    dreamier: ["wonder", "whimsy", "mystery", "mythmaking"],
    weirder: ["absurdity", "machinery", "mystery", "decay"],
    concept_art: ["ritual", "grandeur", "danger", "elegance"],
    print_ready: ["elegance", "mythmaking", "ritual", "grandeur"],
    commercial: ["whimsy", "elegance", "satire", "intimacy"],
};

const MUTATION_ADJACENCY: Record<TasteMutation, TasteMutation[]> = {
    mythmaking: ["ritual", "grandeur", "mystery"],
    melancholy: ["nostalgia", "intimacy", "decay"],
    absurdity: ["satire", "whimsy", "machinery"],
    grandeur: ["mythmaking", "wonder", "danger"],
    intimacy: ["melancholy", "nostalgia", "elegance"],
    decay: ["melancholy", "mystery", "nostalgia"],
    ritual: ["mythmaking", "mystery", "elegance"],
    whimsy: ["absurdity", "wonder", "intimacy"],
    machinery: ["satire", "danger", "wonder"],
    mystery: ["mythmaking", "decay", "ritual"],
    nostalgia: ["melancholy", "intimacy", "decay"],
    satire: ["absurdity", "machinery", "danger"],
    wonder: ["grandeur", "whimsy", "mystery"],
    elegance: ["ritual", "intimacy", "grandeur"],
    danger: ["grandeur", "machinery", "satire"],
};

const LOCAL_COMPLETIONS: Array<{ test: RegExp; suggestions: DreamTrailSuggestion[] }> = [
    {
        test: /^\s*$|^\s*bee\s*$/i,
        suggestions: [
            { text: ", carrying a lantern", mutation: "whimsy", decision: "action", score: 0.72 },
            { text: ", lost in a giant garden", mutation: "wonder", decision: "setting", score: 0.7 },
            { text: ", searching for the last flower", mutation: "mythmaking", decision: "action", score: 0.69 },
            { text: ", wandering a forgotten garden", mutation: "melancholy", decision: "setting", score: 0.68 },
            { text: ", finding a tiny crown in the grass", mutation: "mystery", decision: "symbol", score: 0.66 },
        ],
    },
    {
        test: /\bbee\s+knight\b/i,
        suggestions: [
            { text: ", amber-plated armor", mutation: "elegance", decision: "identity", score: 0.88 },
            { text: ", guarding the hive gates", mutation: "mythmaking", decision: "action", score: 0.86 },
            { text: ", defending the last hive", mutation: "mythmaking", decision: "action", score: 0.91 },
            { text: ", exploring crystal caves beneath the hive", mutation: "wonder", decision: "setting", score: 0.9 },
            { text: ", leading a royal pollen procession", mutation: "ritual", decision: "action", score: 0.88 },
            { text: ", as shadow wasps gather beyond the walls", mutation: "danger", decision: "conflict", score: 0.84 },
            { text: ", beneath a cracked honeycomb banner", mutation: "melancholy", decision: "symbol", score: 0.83 },
            { text: ", beneath the queen's final sunrise", mutation: "melancholy", decision: "symbol", score: 0.82 },
            { text: ", beneath a pollen-lit eclipse", mutation: "wonder", decision: "setting", score: 0.84 },
            { text: ", wearing ceremonial honeycomb armor", mutation: "ritual", decision: "identity", score: 0.77 },
            { text: ", facing a wasp army at dawn", mutation: "danger", decision: "conflict", score: 0.74 },
            { text: ", carrying a velvet banner for one small queen", mutation: "intimacy", decision: "symbol", score: 0.7 },
            { text: ", guarding a ruined hive", mutation: "decay", decision: "action", score: 0.72 },
            { text: ", smiling beneath festival lanterns", mutation: "whimsy", decision: "tone", score: 0.66 },
        ],
    },
    {
        test: /\bbee\s+queen\b/i,
        suggestions: [
            { text: ", holding court on a honeycomb throne", mutation: "grandeur", score: 0.86 },
            { text: ", crowned during a pollen lantern ritual", mutation: "ritual", score: 0.82 },
            { text: ", hiding a tiny royal secret", mutation: "mystery", score: 0.76 },
        ],
    },
    {
        test: /\bforest\b/i,
        suggestions: [
            { text: ", where lantern mushrooms remember old songs", mutation: "nostalgia", score: 0.78 },
            { text: ", hiding a moss-covered altar", mutation: "mystery", score: 0.76 },
            { text: ", under a procession of fireflies", mutation: "wonder", score: 0.74 },
        ],
    },
    {
        test: /\bcastle\b/i,
        suggestions: [
            { text: ", with beeswax windows glowing at dusk", mutation: "wonder", score: 0.76 },
            { text: ", crumbling under velvet banners", mutation: "decay", score: 0.73 },
            { text: ", built around a secret hive chapel", mutation: "ritual", score: 0.71 },
        ],
    },
    {
        test: /\bspace|star|planet|astronaut\b/i,
        suggestions: [
            { text: ", orbiting a honeycomb moon", mutation: "wonder", score: 0.78 },
            { text: ", inside a brass pollen engine", mutation: "machinery", score: 0.74 },
            { text: ", receiving a signal from the old hive", mutation: "mystery", score: 0.72 },
        ],
    },
];

const FALLBACKS: Record<DreamTrailMode, DreamTrailSuggestion[]> = {
    balanced: [
        { text: ", guarding a secret made of pollen", mutation: "mystery", score: 0.68 },
        { text: ", beneath a small impossible moon", mutation: "wonder", score: 0.66 },
        { text: ", wearing a threadbare ceremonial cloak", mutation: "ritual", score: 0.62 },
    ],
    dreamier: [
        { text: ", beneath a pollen-lit eclipse", mutation: "wonder", score: 0.78 },
        { text: ", followed by floating lantern bees", mutation: "whimsy", score: 0.74 },
        { text: ", where moonlight pools like honey", mutation: "wonder", score: 0.70 },
    ],
    weirder: [
        { text: ", inside a cathedral grown from wax", mutation: "absurdity", score: 0.76 },
        { text: ", wearing armor that remembers dreams", mutation: "mystery", score: 0.72 },
        { text: ", escorted by clockwork pollen moths", mutation: "machinery", score: 0.70 },
    ],
    concept_art: [
        { text: ", with a readable ceremonial silhouette", mutation: "ritual", score: 0.72 },
        { text: ", carrying a shield shaped like a relic", mutation: "mythmaking", score: 0.7 },
        { text: ", framed by strong foreground banners", mutation: "grandeur", score: 0.68 },
    ],
    print_ready: [
        { text: ", centered beneath a clean halo of pollen", mutation: "elegance", score: 0.72 },
        { text: ", posed like a collectible myth card", mutation: "mythmaking", score: 0.7 },
        { text: ", bordered by tiny wax sigils", mutation: "ritual", score: 0.68 },
    ],
    commercial: [
        { text: ", holding a charming golden relic", mutation: "elegance", score: 0.7 },
        { text: ", leading a tiny parade of lantern bees", mutation: "whimsy", score: 0.68 },
        { text: ", protecting a polished honey jar kingdom", mutation: "satire", score: 0.64 },
    ],
};

const BANNED_FRAGMENTS = [
    "4k",
    "8k",
    "best quality",
    "masterpiece",
    "trending",
    "award-winning",
    "award winning",
    "high resolution",
    "ultra detailed",
    "midjourney",
    "stable diffusion",
    "diffusion",
    "prompt engineering",
    "beautiful",
    "nice",
    "cool",
    "quality",
    "detailed",
    "render",
    "artstation",
];

const MUTATION_PATTERNS: Record<TasteMutation, RegExp> = {
    mythmaking: /\b(last|first|ancient|legend|oath|kingdom|hive|crown|prophecy|guardian|heir|relic|throne)\b/,
    melancholy: /\b(forgotten|lonely|fading|wilted|rain|mourning|empty|lost|silent|abandoned|farewell)\b/,
    absurdity: /\b(teacup|tiny|impossible|inside-out|upside-down|talking|oversized|miniature|nonsense|juggling)\b/,
    grandeur: /\b(colossal|cathedral|eclipse|procession|towering|vast|imperial|monument|storm-lit|banner)\b/,
    intimacy: /\b(whisper|bedside|pocket|letter|keepsake|small|close|tender|hidden|private|handheld)\b/,
    decay: /\b(rusted|cracked|overgrown|moth-eaten|withered|ruined|tarnished|moss|dust|broken)\b/,
    ritual: /\b(ceremonial|altar|mask|procession|candle|offering|sigil|rune|woven|consecrated|rite)\b/,
    whimsy: /\b(pollen|honey|lantern|dewdrop|storybook|velvet|mushroom|floating|glowing|bee|tiny)\b/,
    machinery: /\b(clockwork|gear|brass|engine|mechanical|automaton|hinged|copper|steam|machine)\b/,
    mystery: /\b(secret|hidden|moonlit|veiled|door|shadow|cipher|unknown|mist|locked|eclipse)\b/,
    nostalgia: /\b(old|vintage|childhood|faded|postcard|attic|heirloom|memory|sepia|keepsake)\b/,
    satire: /\b(bureaucratic|royal decree|paperwork|parade|tiny crown|mock|poster|official|committee)\b/,
    wonder: /\b(eclipse|constellation|aurora|floating|glowing|starlit|luminous|pollen-lit|moon|miracle)\b/,
    elegance: /\b(silk|porcelain|filigree|ivory|graceful|lace|delicate|velvet|ornate|ceremonial)\b/,
    danger: /\b(defending|battlefield|wasp|thorn|storm|blade|last stand|venom|guarding|peril|fang)\b/,
};

const DECISION_PATTERNS: Record<DecisionNeed, RegExp> = {
    identity: /\b(armor|helmet|crown|cloak|sword|shield|mask|knight|queen|king|wizard|bee|dragon|relic|banner-bearer)\b/,
    setting: /\b(gates|walls|hive|castle|forest|battlefield|cathedral|garden|moon|throne|beyond|inside|beneath|under|at dawn)\b/,
    action: /\b(guarding|defending|holding|carrying|leading|facing|wearing|riding|searching|kneeling|returning)\b/,
    conflict: /\b(wasp|shadow|storm|venom|enemy|cracked|ruined|last|final|threat|gather|broken|peril)\b/,
    symbol: /\b(banner|sunrise|eclipse|sigil|relic|crown|altar|halo|standard|flag|rune|emblem|honeycomb)\b/,
    composition: /\b(centered|framed|foreground|silhouette|beneath|against|overhead|close-up|wide|bordered|profile)\b/,
    tone: /\b(final|lonely|festival|quiet|melancholy|triumphant|tender|ominous|joyful|forgotten|secret)\b/,
};

const CADENCE_DECISION: Record<CadencePhase, DecisionNeed> = {
    seed: "identity",
    build: "action",
    twist: "conflict",
    resolve: "symbol",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_DREAMTRAIL_MODEL || "google/gemini-2.5-flash";
const OPENROUTER_TIMEOUT_MS = 1600;

export async function handleDreamTrail(req: any, res: any) {
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.set("Allow", "POST, OPTIONS");
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const payload = parsePayload(req.body ?? {});
    if (!payload) {
        res.status(400).json({ error: "Invalid DreamTrail request" });
        return;
    }

    const fallback = buildLocalResponse(payload);
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        res.status(200).json(fallback);
        return;
    }

    try {
        const parsed = await requestOpenRouter(apiKey, payload);
        const remote = filterSuggestions(parsed?.suggestions ?? [], payload);
        const firstLocal = fallback.suggestions[0];
        const remoteFiltered = filterSuggestions([...remote, ...fallback.suggestions.slice(1)], payload);
        const suggestions = firstLocal ? [firstLocal, ...remoteFiltered].slice(0, 3) : remoteFiltered.slice(0, 3);
        res.status(200).json({ suggestions: suggestions.length ? suggestions : fallback.suggestions });
    } catch (error) {
        logger.warn("[DreamTrail] OpenRouter fallback used.", { error: error instanceof Error ? error.message : String(error) });
        res.status(200).json(fallback);
    }
}

function parsePayload(raw: DreamTrailRequest): DreamTrailPayload | null {
    const prompt = typeof raw.prompt === "string" ? raw.prompt.trim().slice(0, 1000) : "";
    if (prompt.length > 0 && prompt.length < 2) return null;

    const mode = typeof raw.mode === "string" && MODES.has(raw.mode as DreamTrailMode)
        ? raw.mode as DreamTrailMode
        : "balanced";

    const rawHistory = Array.isArray(raw.acceptedHistory)
        ? raw.acceptedHistory
        : Array.isArray(raw.history) ? raw.history : [];
    const acceptedHistory = rawHistory
        .filter((item): item is string => typeof item === "string")
        .map((item) => normalizeSuggestion(item).slice(0, 120))
        .slice(0, 8);

    const tasteVector = parseTasteVector(raw.tasteVector ?? raw.taste);
    const cadenceState = parseCadenceState(raw.cadenceState, acceptedHistory.length);
    const decisionState = parseDecisionState(raw.decisionState, prompt, cadenceState);
    const arrivalState = parseArrivalState(raw.arrivalState, prompt, decisionState);
    const creativeState = parseCreativeState(raw.creativeState, prompt, decisionState, arrivalState, cadenceState);
    const confidenceField = parseConfidenceField(raw.confidenceField, prompt, decisionState, arrivalState, creativeState, cadenceState, acceptedHistory);
    return {
        prompt,
        acceptedHistory,
        tasteVector,
        tasteGravity: parseTasteGravity(raw.tasteGravity, tasteVector),
        cadenceState,
        decisionState,
        arrivalState,
        creativeState,
        confidenceField,
        interventionState: parseInterventionState(raw.interventionState, prompt, confidenceField, creativeState, arrivalState, decisionState),
        mode,
    };
}

async function requestOpenRouter(apiKey: string, payload: DreamTrailPayload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

    try {
        const response = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://dreambees.ai",
                "X-Title": "DreamBees DreamTrail",
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: buildUserInstruction(payload) },
                ],
                response_format: { type: "json_object" },
                temperature: 0.92,
                top_p: 0.92,
                max_tokens: 150,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            throw new Error(`OpenRouter ${response.status}: ${errorText.slice(0, 240)}`);
        }

        const data = await response.json() as {
            choices?: Array<{ message?: { content?: string | null } }>;
        };
        return parseModelJson(data.choices?.[0]?.message?.content ?? "");
    } finally {
        clearTimeout(timeout);
    }
}

function buildUserInstruction(payload: DreamTrailPayload) {
    return JSON.stringify({
        prompt: payload.prompt,
        acceptedHistory: payload.acceptedHistory,
        tasteVector: compactTasteVector(payload.tasteVector),
        tasteGravity: {
            dominantAxes: payload.tasteGravity.dominantAxes,
            suppressedAxes: payload.tasteGravity.suppressedAxes,
            recentTrajectory: payload.tasteGravity.recentTrajectory.slice(0, 5),
            noveltyPressure: Math.round(payload.tasteGravity.noveltyPressure * 100) / 100,
            coherencePressure: Math.round(payload.tasteGravity.coherencePressure * 100) / 100,
        },
        cadenceState: payload.cadenceState,
        decisionState: payload.decisionState,
        arrivalState: payload.arrivalState,
        creativeState: payload.creativeState,
        confidenceField: payload.confidenceField,
        confidenceMode: getConfidenceMode(payload.confidenceField),
        interventionState: payload.interventionState,
        mode: payload.mode,
        modeBias: MODE_MUTATION_BIAS[payload.mode],
        instruction: getConfidenceMode(payload.confidenceField) === "high" || payload.creativeState === "refining" || payload.creativeState === "finished"
            ? "The idea is ready enough. Do not add garnish. If suggesting anything, make it editorially useful: sharpen conflict, strengthen a symbol, or clarify the landing image."
            : "Adapt to confidenceField. Low confidence means act as a creative scout and offer distinct futures. Medium confidence means act as a partner and develop one path. High confidence means act as an editor and stop adding new futures. Also adapt to creativeState.",
    });
}

function extractSubjects(prompt: string): string[] {
    const words = prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !["the", "and", "with", "for", "from", "under", "inside", "near", "beside", "behind", "above", "below", "some", "that", "this", "here", "there"].includes(w));
    return words;
}

function getDynamicFallbackSuggestions(prompt: string, mode: DreamTrailMode): DreamTrailSuggestion[] {
    const subjects = extractSubjects(prompt);
    if (subjects.length === 0) {
        return FALLBACKS[mode] ?? FALLBACKS.balanced;
    }

    // Ensure we have a deterministic hash of the prompt for combinations
    let hashVal = 0;
    for (let i = 0; i < prompt.length; i++) {
        hashVal = (hashVal << 5) - hashVal + prompt.charCodeAt(i);
        hashVal |= 0;
    }
    hashVal = Math.abs(hashVal);

    const ADJECTIVES: Record<TasteMutation, string[]> = {
        wonder: ["luminous", "pollen-lit", "starlit", "celestial", "dream-born", "glowing"],
        mystery: ["veiled", "whispering", "moonlit", "hidden", "shadowy", "forbidden"],
        absurdity: ["impossible", "tiny", "oversized", "inside-out", "flying", "talking"],
        grandeur: ["colossal", "towering", "vast", "imperial", "monumental", "magnificent"],
        intimacy: ["tender", "quiet", "private", "soft", "handheld", "gentle"],
        decay: ["rusted", "overgrown", "moth-eaten", "withered", "ruined", "tarnished"],
        ritual: ["ceremonial", "sacred", "sigil-etched", "woven", "consecrated", "ancient"],
        whimsy: ["velvet", "dewdrop", "storybook", "playful", "floating", "sweet"],
        machinery: ["clockwork", "mechanical", "hinged", "brass", "steam-driven", "copper"],
        nostalgia: ["faded", "vintage", "half-remembered", "old", "childhood", "heirloom"],
        satire: ["bureaucratic", "decreed", "committee-approved", "mock", "pompous", "official"],
        elegance: ["silk-draped", "filigree", "porcelain", "delicate", "ornate", "graceful"],
        danger: ["storm-lashed", "venomous", "barbed", "sharp", "fierce", "threatening"],
        mythmaking: ["legendary", "ancestral", "prophetic", "forgotten", "royal", "sacred"],
        melancholy: ["lonely", "silent", "wilted", "fading", "mournful", "empty"]
    };

    const TEMPLATES: Record<TasteMutation, Array<(s: string, a: string) => string>> = {
        wonder: [
            (s, a) => `, beneath a ${a} ${s} eclipse`,
            (s, a) => `, under a sky of glowing ${s} constellations`,
            (s, a) => `, surrounded by floating ${a} ${s} dust`,
            (s, a) => `, where the ${s} glows with a ${a} light`
        ],
        mystery: [
            (s, a) => `, hiding a ${a} ${s} in the shadows`,
            (s, a) => `, guided by a ${a} ${s} lantern`,
            (s, a) => `, guarding the secrets of the ${a} ${s}`,
            (s, a) => `, searching for a ${a} ${s} gate`
        ],
        absurdity: [
            (s, a) => `, wearing a ${a} crown made of ${s}s`,
            (s, a) => `, riding a ${a} ${s} through the clouds`,
            (s, a) => `, inside a house built entirely of ${a} ${s}s`,
            (s, a) => `, talking to a ${a} ${s} at tea time`
        ],
        grandeur: [
            (s, a) => `, framed by colossal ${a} ${s} pillars`,
            (s, a) => `, rising above a vast valley of ${s}s`,
            (s, a) => `, facing the imperial gateway of the ${a} ${s}`,
            (s, a) => `, holding high a monumental ${a} ${s} banner`
        ],
        intimacy: [
            (s, a) => `, holding a ${a} ${s} close to their chest`,
            (s, a) => `, sharing a quiet moment with a ${a} ${s}`,
            (s, a) => `, keeping a tiny ${s} tucked inside a pocket`,
            (s, a) => `, whispering a secret to the ${a} ${s}`
        ],
        decay: [
            (s, a) => `, crumbling beneath ${a} ${s} vines`,
            (s, a) => `, surrounded by rusted ${s} relics of the past`,
            (s, a) => `, in a ruined garden overgrown with ${a} ${s}s`,
            (s, a) => `, where a withered ${s} turned to dust`
        ],
        ritual: [
            (s, a) => `, for the annual ${a} ${s} procession`,
            (s, a) => `, offering a consecrated ${s} to the altar`,
            (s, a) => `, wearing ceremonial ${a} ${s} robes`,
            (s, a) => `, performing the sacred rite of the ${s}`
        ],
        whimsy: [
            (s, a) => `, with playful starlight ${s} wings`,
            (s, a) => `, carrying a sweet ${a} ${s} jar`,
            (s, a) => `, dancing with floating ${a} ${s} fireflies`,
            (s, a) => `, in a storybook forest of ${a} ${s}s`
        ],
        machinery: [
            (s, a) => `, powered by a complex clockwork ${s} engine`,
            (s, a) => `, inside a copper workshop filled with ${a} ${s}s`,
            (s, a) => `, tuning a brass mechanical ${s}`,
            (s, a) => `, with gears rotating inside a ${a} ${s}`
        ],
        nostalgia: [
            (s, a) => `, recalling a fading memory of a ${a} ${s}`,
            (s, a) => `, holding a vintage ${a} ${s} postcard`,
            (s, a) => `, surrounded by childhood ${s} keepsakes`,
            (s, a) => `, in an old attic filled with ${a} ${s}s`
        ],
        satire: [
            (s, a) => `, presenting an official bureaucratic ${s} decree`,
            (s, a) => `, in a mock parade for the royal ${a} ${s}`,
            (s, a) => `, filling out paperwork for a ${a} ${s}`,
            (s, a) => `, governed by a pompous committee of ${s}s`
        ],
        elegance: [
            (s, a) => `, draped in delicate ${a} ${s} silk`,
            (s, a) => `, holding a finely carved porcelain ${s}`,
            (s, a) => `, decorated with ornate gold ${s} filigree`,
            (s, a) => `, displaying the graceful lines of a ${a} ${s}`
        ],
        danger: [
            (s, a) => `, defending the hive from a storm of ${a} ${s}s`,
            (s, a) => `, facing a fierce threat of sharp ${s} thorns`,
            (s, a) => `, armed with a venomous ${a} ${s} blade`,
            (s, a) => `, escaping a perilous trap of ${a} ${s}s`
        ],
        mythmaking: [
            (s, a) => `, protecting the legendary crown of the ${s}`,
            (s, a) => `, tracing the ancestral prophecy of the ${a} ${s}`,
            (s, a) => `, guarding the royal lineage of the ${s} kingdom`,
            (s, a) => `, seeking the forgotten relic of the ${a} ${s}`
        ],
        melancholy: [
            (s, a) => `, lost in a lonely rain-slicked ${s} street`,
            (s, a) => `, staring at a fading ${a} ${s} in the dark`,
            (s, a) => `, under a silent, grey sky of ${s} clouds`,
            (s, a) => `, mourning the loss of a ${a} ${s}`
        ]
    };

    const suggestions: DreamTrailSuggestion[] = [];
    const keys = Object.keys(TEMPLATES) as TasteMutation[];

    keys.forEach((mutation, idx) => {
        const adjectiveList = ADJECTIVES[mutation];
        const templateList = TEMPLATES[mutation];

        // Pick dynamic components based on the deterministic hash
        const subject = subjects[(hashVal + idx) % subjects.length];
        const adj = adjectiveList[(hashVal + idx) % adjectiveList.length];
        const template = templateList[(hashVal + idx) % templateList.length];

        const text = template(subject, adj);

        // Map each template to a typical creative decision
        const decisions: DecisionNeed[] = ["setting", "symbol", "identity", "composition", "action", "identity", "setting", "tone", "conflict", "identity"];
        const decision = decisions[idx % decisions.length];

        suggestions.push({
            text,
            mutation,
            decision,
            score: 0.70 + ((hashVal + idx) % 15) * 0.01 // deterministic varied score around 0.70 - 0.85
        });
    });

    const modeBiases: Record<DreamTrailMode, TasteMutation[]> = {
        balanced: ["wonder", "mystery", "whimsy", "ritual"],
        dreamier: ["wonder", "whimsy", "mystery", "elegance"],
        weirder: ["absurdity", "machinery", "decay", "mystery"],
        concept_art: ["grandeur", "danger", "ritual", "machinery"],
        print_ready: ["elegance", "ritual", "wonder", "grandeur"],
        commercial: ["whimsy", "elegance", "wonder", "mystery"]
    };

    const preferredMutations = modeBiases[mode] || modeBiases.balanced;

    return suggestions.sort((a, b) => {
        const aPref = preferredMutations.indexOf(a.mutation);
        const bPref = preferredMutations.indexOf(b.mutation);
        if (aPref !== -1 && bPref !== -1) return aPref - bPref;
        if (aPref !== -1) return -1;
        if (bPref !== -1) return 1;
        return b.score - a.score;
    });
}

function buildLocalResponse(payload: DreamTrailPayload) {
    const source = payload.prompt.trim();
    if ((source.length < 3 && payload.creativeState !== "blank") || /(?:,|\band|\bwith|\bof|\bin|\bon|\bthe)$/i.test(source) || !isLastWordComplete(source)) {
        return { suggestions: [] };
    }

    const cleanSource = source.toLowerCase().trim();
    const LOCAL_TARGETS = [
        { targets: ["bee"] },
        { targets: ["bee knight"] },
        { targets: ["bee queen"] },
        { targets: ["forest"] },
        { targets: ["castle"] },
        { targets: ["space", "star", "planet", "astronaut"] }
    ];

    const mapped = LOCAL_COMPLETIONS.find((entry, idx) => {
        if (entry.test.test(source)) return true;
        const targetMap = LOCAL_TARGETS[idx];
        if (targetMap && cleanSource.length >= 2) {
            return targetMap.targets.some((target) => 
                target.startsWith(cleanSource) || 
                target.split(/\s+/).some(word => word.startsWith(cleanSource))
            );
        }
        return false;
    });

    const candidates = mapped 
        ? [...mapped.suggestions, ...getDynamicFallbackSuggestions(source, payload.mode)]
        : getDynamicFallbackSuggestions(source, payload.mode);
    return { suggestions: filterSuggestions(candidates, payload).slice(0, 3) };
}

function parseModelJson(text: string): { suggestions?: unknown } | null {
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? { suggestions: parsed } : parsed;
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch {
            return null;
        }
    }
}

function filterSuggestions(raw: unknown, payload: DreamTrailPayload) {
    if (!Array.isArray(raw)) return [];
    const accepted: DreamTrailSuggestion[] = [];
    const promptTokens = tokenSet(payload.prompt);

    for (const item of raw) {
        const suggestion = normalizeDreamTrailSuggestion(item, payload);
        if (!suggestion) continue;
        const lower = suggestion.text.toLowerCase();
        if (BANNED_FRAGMENTS.some((fragment) => lower.includes(fragment))) continue;
        if (isKeywordSoup(suggestion.text)) continue;
        if (wordCount(suggestion.text) < 3 || wordCount(suggestion.text) > 14) continue;
        if (payload.acceptedHistory.some((history) => similarity(tokenSet(history), tokenSet(suggestion.text)) > 0.62)) continue;
        if (similarity(promptTokens, tokenSet(suggestion.text)) > 0.72) continue;
        if (accepted.some((existing) => similarity(tokenSet(existing.text), tokenSet(suggestion.text)) > 0.44)) continue;
        accepted.push({
            ...suggestion,
            score: scoreSuggestion(suggestion, payload),
        });
        if (accepted.length >= 10) break;
    }

    return orderWithTasteGravity(accepted, payload.tasteGravity);
}

function normalizeDreamTrailSuggestion(item: unknown, payload: DreamTrailPayload): DreamTrailSuggestion | null {
    if (typeof item === "string") {
        const text = normalizeSuggestion(item);
        if (!text) return null;
        const mutation = detectMutation(text);
        const decision = detectDecision(text);
        return { text, mutation, decision, score: scoreSuggestion({ text, mutation, decision, score: 0.5 }, payload) };
    }

    if (!item || typeof item !== "object") return null;
    const raw = item as { text?: unknown; mutation?: unknown; decision?: unknown; score?: unknown };
    if (typeof raw.text !== "string") return null;
    const text = normalizeSuggestion(raw.text);
    if (!text) return null;
    const mutation = isMutation(raw.mutation) ? raw.mutation : detectMutation(text);
    const decision = isDecisionNeed(raw.decision) ? raw.decision : detectDecision(text);
    const score = typeof raw.score === "number" && Number.isFinite(raw.score) ? raw.score : 0.5;
    return { text, mutation, decision, score: clamp01(score) };
}

function normalizeSuggestion(value: string) {
    const trimmed = value
        .replace(/^["'\s]+|["'\s]+$/g, "")
        .replace(/[.!?]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!trimmed) return "";
    if (/^(,|\band\b|\bwith\b|\bbeneath\b|\bunder\b|\binside\b|\bwearing\b|\bholding\b|\bdefending\b)/i.test(trimmed)) {
        return trimmed.replace(/\s+([,;:])/g, "$1");
    }
    return `, ${trimmed}`;
}

function detectMutation(text: string): TasteMutation {
    const lower = text.toLowerCase();
    let best: TasteMutation = "wonder";
    let bestScore = 0;
    MUTATION_KEYS.forEach((key) => {
        const matches = lower.match(MUTATION_PATTERNS[key]);
        const score = matches ? matches.length : 0;
        if (score > bestScore) {
            best = key;
            bestScore = score;
        }
    });
    return best;
}

function detectDecision(text: string): DecisionNeed {
    const lower = text.toLowerCase();
    let best: DecisionNeed = "symbol";
    let bestScore = 0;
    DECISION_KEYS.forEach((key) => {
        const matches = lower.match(DECISION_PATTERNS[key]);
        const score = matches ? matches.length : 0;
        if (score > bestScore) {
            best = key;
            bestScore = score;
        }
    });
    return best;
}

function scoreSuggestion(suggestion: DreamTrailSuggestion, payload: DreamTrailPayload) {
    let score = clamp01(suggestion.score) * 0.75 + payload.tasteVector[suggestion.mutation] * 0.18;
    const isDominant = payload.tasteGravity.dominantAxes.includes(suggestion.mutation);
    const isAdjacent = payload.tasteGravity.dominantAxes.some((axis) => MUTATION_ADJACENCY[axis].includes(suggestion.mutation));
    const lastThree = payload.tasteGravity.recentTrajectory.slice(0, 3);
    if (MODE_MUTATION_BIAS[payload.mode].includes(suggestion.mutation)) score += 0.05;
    if (isAdjacent) score += 0.13 * payload.tasteGravity.noveltyPressure;
    if (isDominant) score += 0.08 * payload.tasteGravity.coherencePressure;
    if (payload.tasteGravity.suppressedAxes.includes(suggestion.mutation)) {
        score += payload.tasteGravity.noveltyPressure > 0.7 ? 0.08 : -0.04;
    }
    if (lastThree.filter((axis) => axis === suggestion.mutation).length > 2) score *= 0.6;
    score += scoreConfidence(suggestion, payload.confidenceField, payload.arrivalState);
    score += scoreCadence(suggestion, payload.cadenceState);
    score += scoreCreativeState(suggestion, payload.creativeState, payload.arrivalState, payload.decisionState);
    score += payload.creativeState === "refining" || payload.creativeState === "finished"
        ? scoreEditorialUsefulness(suggestion, payload.arrivalState, payload.decisionState)
        : scoreDecision(suggestion, payload.decisionState);
    if (/\b(defending|last|beneath|ceremonial|secret|eclipse|forgotten|impossible|procession|hive)\b/i.test(suggestion.text)) score += 0.035;
    score -= Math.max(0, wordCount(suggestion.text) - 10) * 0.015;
    return clamp01(score);
}

function orderWithTasteGravity(suggestions: DreamTrailSuggestion[], gravity: TasteGravity) {
    const sorted = [...suggestions].sort((a, b) => b.score - a.score);
    const ordered = sorted;

    if (gravity.noveltyPressure > 0.7) {
        const contrast = ordered.find((suggestion) => {
            const adjacent = gravity.dominantAxes.some((axis) => MUTATION_ADJACENCY[axis].includes(suggestion.mutation));
            return gravity.suppressedAxes.includes(suggestion.mutation) || (!gravity.dominantAxes.includes(suggestion.mutation) && !adjacent);
        });
        if (contrast) {
            const without = ordered.filter((suggestion) => suggestion !== contrast);
            without.splice(Math.min(2, without.length), 0, contrast);
            return without;
        }
    }

    return ordered;
}

function scoreCadence(suggestion: DreamTrailSuggestion, cadence: CadenceState) {
    const text = suggestion.text.toLowerCase();
    const words = wordCount(suggestion.text);
    let score = 0;

    if (cadence.phraseLengthBias === "short" && words <= 5) score += 0.06;
    if (cadence.phraseLengthBias === "medium" && words >= 6 && words <= 11) score += 0.06;

    if (cadence.currentPhase === "seed") {
        if (/\b(armor|crown|cloak|relic|lantern|shield|mask|hive)\b/.test(text)) score += 0.3;
        if (/\b(guarding|defending|as shadow|beyond|final|last|ruined)\b/.test(text)) score -= 0.14;
        if (/\b(final|last|beyond|as shadow|ruined)\b/.test(text)) score -= 0.08;
    } else if (cadence.currentPhase === "build") {
        if (/\b(guarding|defending|carrying|leading|holding|at the gates|procession)\b/.test(text)) score += 0.22;
    } else if (cadence.currentPhase === "twist") {
        if (/\b(as|but|while|beyond|shadow|wasp|storm|secret|impossible|ruined|venom)\b/.test(text)) score += 0.24;
        if (suggestion.mutation === "danger" || suggestion.mutation === "mystery" || suggestion.mutation === "absurdity") score += 0.16;
        if (/\b(armor|crown|cloak|gates)\b/.test(text)) score -= 0.12;
    } else {
        if (/\b(final|last|sunrise|farewell|returns|home|quiet|beneath|after)\b/.test(text)) score += 0.26;
        if (suggestion.mutation === "melancholy" || suggestion.mutation === "wonder" || suggestion.mutation === "intimacy") score += 0.12;
        if (/\b(guarding|defending|as shadow|gates|armor)\b/.test(text)) score -= 0.16;
        if (/\b(and then|another|more|extra)\b/.test(text)) score -= 0.1;
    }

    return score * (0.72 + cadence.escalationLevel * 0.28);
}

function scoreDecision(suggestion: DreamTrailSuggestion, decision: DecisionState) {
    const suggestionDecision = suggestion.decision ?? detectDecision(suggestion.text);
    let score = 0;
    if (suggestionDecision === decision.strongestNeed) score += 0.32;
    if (decision.missingNeeds.includes(suggestionDecision)) score += 0.14;
    if (decision.alreadySatisfied.includes(suggestionDecision) && suggestionDecision !== decision.strongestNeed) score -= 0.18;
    if (decision.alreadySatisfied.includes(suggestionDecision) && suggestionDecision === "identity") score -= 0.08;
    return score;
}

function scoreConfidence(suggestion: DreamTrailSuggestion, confidence: ConfidenceField, arrival: ArrivalState) {
    const suggestionDecision = suggestion.decision ?? detectDecision(suggestion.text);
    const mode = getConfidenceMode(confidence);
    const text = suggestion.text.toLowerCase();
    let score = 0;

    if (mode === "low") {
        if (suggestionDecision === "action" || suggestionDecision === "setting") score += 0.25;
        if (suggestionDecision === "conflict") score += 0.15;
        if (/\b(defending|exploring|leading|lost|searching|carrying|wandering|finding)\b/.test(text)) score += 0.15;
        if (suggestionDecision === "identity" && arrival.hasIdentity) score -= 0.18;
    } else if (mode === "medium") {
        if (!arrival.hasConflict && suggestionDecision === "conflict") score += 0.25;
        if (arrival.hasConflict && !arrival.hasSymbol && suggestionDecision === "symbol") score += 0.18;
        if (suggestionDecision === "action" && !arrival.hasAction) score += 0.15;
        if (suggestionDecision === "setting" && !arrival.hasSetting) score += 0.15;
        if (suggestionDecision === "identity" && arrival.hasIdentity) score -= 0.2;
    } else {
        if (suggestionDecision === "composition" || suggestionDecision === "symbol" || suggestionDecision === "tone") score += 0.25;
        if (suggestionDecision === "identity" || suggestionDecision === "action" || suggestionDecision === "setting") score -= 0.2;
        
        // Favor smaller and more focused suggestions for subtle assertiveness
        const words = wordCount(suggestion.text);
        if (words <= 7) score += 0.15;
        else if (words >= 10) score -= 0.2;
    }

    return score;
}

function scoreCreativeState(
    suggestion: DreamTrailSuggestion,
    creativeState: CreativeState,
    arrival: ArrivalState,
    decision: DecisionState
) {
    const suggestionDecision = suggestion.decision ?? detectDecision(suggestion.text);
    const text = suggestion.text.toLowerCase();
    let score = 0;

    if (creativeState === "blank") {
        if (suggestionDecision === "action" || suggestionDecision === "setting") score += 0.26;
        if (/\b(carrying|lost|searching|finding|walking|following)\b/.test(text)) score += 0.14;
        if (suggestionDecision === "identity") score -= 0.16;
    } else if (creativeState === "searching") {
        if (suggestionDecision === "action" || suggestionDecision === "setting") score += 0.2;
        if (/\b(defending|exploring|leading|searching|finding)\b/.test(text)) score += 0.12;
        if (suggestionDecision === "identity") score -= 0.75;
        if (suggestionDecision === "symbol") score -= 0.24;
    } else if (creativeState === "exploring") {
        if (suggestionDecision === "conflict") score += 0.3;
        if (suggestionDecision === "setting" && !arrival.hasSetting) score += 0.16;
        if (suggestionDecision === "setting" && arrival.hasSetting) score -= 0.2;
        if (/\b(as|while|beyond|beneath|inside)\b/.test(text)) score += 0.1;
        if (!arrival.hasConflict && suggestionDecision === "symbol") score -= 0.08;
        if (suggestionDecision === "identity") score -= 0.6;
        if (suggestionDecision === "action" && arrival.hasAction) score -= 0.18;
    } else if (creativeState === "committing") {
        if (suggestionDecision === "symbol" || suggestionDecision === "tone" || suggestionDecision === "composition") score += 0.22;
        if (suggestionDecision === "setting" && !arrival.hasSetting) score += 0.14;
        if (suggestionDecision === "setting" && arrival.hasSetting) score -= 0.24;
        if (decision.alreadySatisfied.includes(suggestionDecision)) score -= 0.12;
        if (suggestionDecision === "identity") score -= 0.24;
    } else if (creativeState === "refining" || creativeState === "finished") {
        if (suggestionDecision === "composition" || suggestionDecision === "symbol" || suggestionDecision === "tone") score += 0.25;
        if (suggestionDecision === "setting" && arrival.hasSetting) score -= 0.2;
        if (suggestionDecision === "identity" || suggestionDecision === "action") score -= 0.2;
    } else {
        score -= 0.1;
    }

    return score;
}

function scoreEditorialUsefulness(suggestion: DreamTrailSuggestion, arrival: ArrivalState, decision: DecisionState) {
    const suggestionDecision = suggestion.decision ?? detectDecision(suggestion.text);
    const text = suggestion.text.toLowerCase();
    let score = 0;

    if (arrival.nextBestMove === "sharpen") {
        if (suggestionDecision === "conflict" || suggestionDecision === "symbol") score += 0.3;
    } else if (arrival.nextBestMove === "tighten") {
        if (suggestionDecision === "composition" || suggestionDecision === "symbol" || suggestionDecision === "tone") score += 0.16;
        if (wordCount(suggestion.text) <= 8) score += 0.1;
    } else if (arrival.nextBestMove === "generate") {
        if (suggestionDecision === "composition" || suggestionDecision === "symbol" || suggestionDecision === "tone") score += 0.15;
    }

    if (decision.alreadySatisfied.includes(suggestionDecision)) score -= 0.12;
    if (suggestionDecision === "identity" && arrival.hasIdentity) score -= 0.28;
    if (suggestionDecision === "action" && arrival.hasAction) score -= 0.42;
    if (suggestionDecision === "setting" && arrival.hasSetting) score -= 0.22;
    if ((arrival.nextBestMove === "tighten" || arrival.nextBestMove === "generate") && suggestionDecision === "setting" && arrival.hasSetting) score -= 0.35;
    if (suggestionDecision === "conflict" && arrival.hasConflict && arrival.hasSymbol) score -= 0.1;
    if (arrival.hasAction && /\b(guarding|defending|holding|carrying|leading|wearing)\b/.test(text)) score -= 0.16;
    if (!arrival.hasConflict && suggestionDecision === "conflict") score += 0.22;
    if (!arrival.hasSymbol && suggestionDecision === "symbol") score += 0.2;
    return score;
}

function parseTasteVector(raw: unknown): TasteVector {
    if (!raw || typeof raw !== "object") return DEFAULT_TASTE_VECTOR;
    const source = raw as Partial<Record<TasteMutation, unknown>>;
    const next = {} as TasteVector;
    MUTATION_KEYS.forEach((key) => {
        const value = source[key];
        next[key] = clamp01(typeof value === "number" ? value : DEFAULT_TASTE_VECTOR[key]);
    });
    return next;
}

function parseTasteGravity(raw: unknown, vector: TasteVector): TasteGravity {
    const fallback = buildTasteGravity(vector, []);
    if (!raw || typeof raw !== "object") return fallback;
    const source = raw as Partial<Record<keyof TasteGravity, unknown>>;
    return {
        dominantAxes: parseAxisList(source.dominantAxes, fallback.dominantAxes),
        suppressedAxes: parseAxisList(source.suppressedAxes, fallback.suppressedAxes),
        recentTrajectory: parseAxisList(source.recentTrajectory, fallback.recentTrajectory),
        noveltyPressure: clamp01(typeof source.noveltyPressure === "number" ? source.noveltyPressure : fallback.noveltyPressure),
        coherencePressure: clamp01(typeof source.coherencePressure === "number" ? source.coherencePressure : fallback.coherencePressure),
    };
}

function parseCadenceState(raw: unknown, acceptedCountFallback: number): CadenceState {
    const fallback = buildCadenceState(acceptedCountFallback);
    if (!raw || typeof raw !== "object") return fallback;
    const source = raw as Partial<Record<keyof CadenceState, unknown>>;
    const acceptedCount = typeof source.acceptedCount === "number" && Number.isFinite(source.acceptedCount)
        ? Math.max(0, Math.floor(source.acceptedCount))
        : fallback.acceptedCount;
    const currentPhase = isCadencePhase(source.currentPhase) ? source.currentPhase : phaseForCount(acceptedCount);
    const phraseLengthBias = source.phraseLengthBias === "short" || source.phraseLengthBias === "medium"
        ? source.phraseLengthBias
        : currentPhase === "seed" || currentPhase === "build" ? "short" : "medium";
    return {
        acceptedCount,
        currentPhase,
        phraseLengthBias,
        escalationLevel: clamp01(typeof source.escalationLevel === "number" ? source.escalationLevel : acceptedCount / 3),
    };
}

function parseDecisionState(raw: unknown, prompt: string, cadence: CadenceState): DecisionState {
    const fallback = buildDecisionState(prompt, cadence);
    if (!raw || typeof raw !== "object") return fallback;
    const source = raw as Partial<Record<keyof DecisionState, unknown>>;
    return {
        missingNeeds: parseDecisionList(source.missingNeeds, fallback.missingNeeds),
        strongestNeed: isDecisionNeed(source.strongestNeed) ? source.strongestNeed : fallback.strongestNeed,
        alreadySatisfied: parseDecisionList(source.alreadySatisfied, fallback.alreadySatisfied),
    };
}

function parseArrivalState(raw: unknown, prompt: string, decision: DecisionState): ArrivalState {
    const fallback = buildArrivalState(prompt, decision);
    if (!raw || typeof raw !== "object") return fallback;
    const source = raw as Partial<Record<keyof ArrivalState, unknown>>;
    return {
        hasIdentity: typeof source.hasIdentity === "boolean" ? source.hasIdentity : fallback.hasIdentity,
        hasAction: typeof source.hasAction === "boolean" ? source.hasAction : fallback.hasAction,
        hasSetting: typeof source.hasSetting === "boolean" ? source.hasSetting : fallback.hasSetting,
        hasConflict: typeof source.hasConflict === "boolean" ? source.hasConflict : fallback.hasConflict,
        hasSymbol: typeof source.hasSymbol === "boolean" ? source.hasSymbol : fallback.hasSymbol,
        readinessScore: clamp01(typeof source.readinessScore === "number" ? source.readinessScore : fallback.readinessScore),
        nextBestMove: isArrivalMove(source.nextBestMove) ? source.nextBestMove : fallback.nextBestMove,
    };
}

function parseCreativeState(
    raw: unknown,
    prompt: string,
    decision: DecisionState,
    arrival: ArrivalState,
    cadence: CadenceState
): CreativeState {
    return isCreativeState(raw) ? raw : buildCreativeState(prompt, decision, arrival, cadence);
}

function parseConfidenceField(
    raw: unknown,
    prompt: string,
    decision: DecisionState,
    arrival: ArrivalState,
    creativeState: CreativeState,
    cadence: CadenceState,
    acceptedHistory: string[]
): ConfidenceField {
    const fallback = buildConfidenceField(prompt, decision, arrival, creativeState, cadence, acceptedHistory);
    if (!raw || typeof raw !== "object") return fallback;
    const source = raw as Partial<Record<keyof ConfidenceField, unknown>>;
    return {
        directionConfidence: clamp01(typeof source.directionConfidence === "number" ? source.directionConfidence : fallback.directionConfidence),
        conceptConfidence: clamp01(typeof source.conceptConfidence === "number" ? source.conceptConfidence : fallback.conceptConfidence),
        executionConfidence: clamp01(typeof source.executionConfidence === "number" ? source.executionConfidence : fallback.executionConfidence),
    };
}

function parseInterventionState(
    raw: unknown,
    prompt: string,
    confidence: ConfidenceField,
    creativeState: CreativeState,
    arrival: ArrivalState,
    decision: DecisionState
): InterventionState {
    const fallback = buildInterventionState(prompt, confidence, creativeState, arrival, decision);
    if (!raw || typeof raw !== "object") return fallback;
    const source = raw as Partial<Record<keyof InterventionState, unknown>>;
    return {
        uncertaintyScore: clamp01(typeof source.uncertaintyScore === "number" ? source.uncertaintyScore : fallback.uncertaintyScore),
        attentionCost: clamp01(typeof source.attentionCost === "number" ? source.attentionCost : fallback.attentionCost),
        expectedMomentumGain: clamp01(typeof source.expectedMomentumGain === "number" ? source.expectedMomentumGain : fallback.expectedMomentumGain),
        interventionLevel: isInterventionLevel(source.interventionLevel) ? source.interventionLevel : fallback.interventionLevel,
        reason: isInterventionReason(source.reason) ? source.reason : fallback.reason,
    };
}

function buildDecisionState(prompt: string, cadence: CadenceState): DecisionState {
    const lower = prompt.toLowerCase();
    const alreadySatisfied = DECISION_KEYS.filter((need) => DECISION_PATTERNS[need].test(lower));
    const missingNeeds = DECISION_KEYS.filter((need) => !alreadySatisfied.includes(need));
    const phaseNeed = CADENCE_DECISION[cadence.currentPhase];
    const needsIdentitySpecificity = phaseNeed === "identity" && !/\b(armor|helmet|cloak|crown|shield|sword|mask)\b/i.test(prompt);
    const strongestNeed = missingNeeds.includes(phaseNeed)
        ? phaseNeed
        : needsIdentitySpecificity ? "identity" : missingNeeds[0] ?? phaseNeed;
    return { missingNeeds, strongestNeed, alreadySatisfied };
}

function buildArrivalState(prompt: string, decision: DecisionState): ArrivalState {
    const lower = prompt.toLowerCase();
    const hasIdentity = decision.alreadySatisfied.includes("identity");
    const hasAction = decision.alreadySatisfied.includes("action");
    const hasSetting = decision.alreadySatisfied.includes("setting");
    const hasConflict = decision.alreadySatisfied.includes("conflict");
    const hasSymbol = decision.alreadySatisfied.includes("symbol");
    const hasComposition = decision.alreadySatisfied.includes("composition");
    const hasTone = decision.alreadySatisfied.includes("tone");
    const structuralArrival = (hasIdentity && hasAction && hasSetting) || (hasIdentity && hasConflict && hasSymbol);
    const commaCount = (prompt.match(/,/g) ?? []).length;

    let readinessScore = 0;
    if (hasIdentity) readinessScore += 0.24;
    if (hasAction) readinessScore += 0.18;
    if (hasSetting) readinessScore += 0.18;
    if (hasConflict) readinessScore += 0.16;
    if (hasSymbol) readinessScore += 0.16;
    if (hasComposition) readinessScore += 0.04;
    if (hasTone) readinessScore += 0.04;
    if (structuralArrival) readinessScore = Math.max(readinessScore, ARRIVAL_THRESHOLD);
    if (commaCount >= 5) readinessScore = Math.min(1, readinessScore + 0.06);
    if (wordCount(prompt) > 28) readinessScore = Math.min(1, readinessScore + 0.04);
    readinessScore = clamp01(readinessScore);

    let nextBestMove: ArrivalMove = "continue";
    if (readinessScore >= ARRIVAL_THRESHOLD) {
        if (commaCount >= 4 || /\b(armor|helmet|shield|sword|cloak|banner|eclipse|gate|wall|wasp|shadow)\b/.test(lower)) {
            nextBestMove = "tighten";
        } else if (!hasConflict || !hasSymbol) {
            nextBestMove = "sharpen";
        } else {
            nextBestMove = readinessScore >= 0.84 ? "generate" : "tighten";
        }
    }

    return { hasIdentity, hasAction, hasSetting, hasConflict, hasSymbol, readinessScore, nextBestMove };
}

function buildCreativeState(
    prompt: string,
    _decision: DecisionState,
    arrival: ArrivalState,
    cadence: CadenceState
): CreativeState {
    const clean = prompt.trim();
    const words = wordCount(clean);
    if (!clean || words <= 1) return "blank";
    if (arrival.readinessScore >= FINISHED_THRESHOLD && arrival.hasIdentity && arrival.hasAction && arrival.hasSetting && arrival.hasConflict && arrival.hasSymbol) {
        return "finished";
    }
    if (arrival.hasIdentity && arrival.hasAction && arrival.hasSetting && !arrival.hasConflict && !arrival.hasSymbol) {
        return "exploring";
    }
    if (arrival.readinessScore >= ARRIVAL_THRESHOLD) return "refining";
    if (arrival.hasIdentity && arrival.hasAction && arrival.hasConflict) return "committing";
    if (arrival.hasIdentity && (arrival.hasAction || arrival.hasSetting || cadence.currentPhase === "build" || cadence.currentPhase === "twist")) {
        return "exploring";
    }
    return "searching";
}

function buildConfidenceField(
    prompt: string,
    decision: DecisionState,
    arrival: ArrivalState,
    creativeState: CreativeState,
    cadence: CadenceState,
    acceptedHistory: string[]
): ConfidenceField {
    const clean = prompt.trim();
    const lower = clean.toLowerCase();
    const words = wordCount(clean);
    const acceptedInPrompt = acceptedHistory.filter((item) => lower.includes(item.replace(/^,\s*/, "").toLowerCase()));

    let directionConfidence = 0.08;
    if (arrival.hasIdentity) directionConfidence += 0.16;
    if (arrival.hasAction) directionConfidence += 0.2;
    if (arrival.hasSetting) directionConfidence += 0.16;
    if (arrival.hasConflict) directionConfidence += 0.2;
    if (arrival.hasSymbol) directionConfidence += 0.12;
    if (creativeState === "blank") directionConfidence -= 0.18;
    if (creativeState === "searching") directionConfidence -= 0.08;
    if (creativeState === "committing" || creativeState === "refining") directionConfidence += 0.1;
    if (words <= 2) directionConfidence -= 0.12;

    let conceptConfidence = 0.16;
    conceptConfidence += Math.min(0.22, words * 0.018);
    conceptConfidence += decision.alreadySatisfied.length * 0.055;
    if (/\b(ceremonial|honeycomb|amber|shadow|pollen|cracked|banner|gates|armor|wasps|lantern|procession)\b/.test(lower)) conceptConfidence += 0.2;
    if (/\b(cool|thing|stuff|vibe|aesthetic|fantasy|random|whatever|nice|beautiful)\b/.test(lower)) conceptConfidence -= 0.24;
    if (creativeState === "blank") conceptConfidence -= 0.12;

    let executionConfidence = arrival.readinessScore * 0.58 + cadence.escalationLevel * 0.18;
    executionConfidence += Math.min(0.14, acceptedInPrompt.length * 0.045);
    if (creativeState === "refining") executionConfidence += 0.12;
    if (creativeState === "finished") executionConfidence += 0.22;
    if (words <= 2) executionConfidence -= 0.12;

    return {
        directionConfidence: clamp01(directionConfidence),
        conceptConfidence: clamp01(conceptConfidence),
        executionConfidence: clamp01(executionConfidence),
    };
}

function getConfidenceMode(confidence: ConfidenceField): ConfidenceMode {
    const average = (confidence.directionConfidence + confidence.conceptConfidence + confidence.executionConfidence) / 3;
    if (confidence.executionConfidence >= HIGH_CONFIDENCE_THRESHOLD || average >= 0.74) return "high";
    if (confidence.directionConfidence < 0.42 || confidence.conceptConfidence < 0.38) return "low";
    return "medium";
}

function getGhostAssertiveness(confidence: ConfidenceField): GhostAssertiveness {
    const mode = getConfidenceMode(confidence);
    if (mode === "low") return "strong";
    if (mode === "high") return "subtle";
    return "normal";
}

function buildInterventionState(
    prompt: string,
    confidence: ConfidenceField,
    creativeState: CreativeState,
    arrival: ArrivalState,
    decision: DecisionState
): InterventionState {
    const clean = prompt.trim();
    const words = wordCount(clean);
    const commaCount = (clean.match(/,/g) ?? []).length;
    const isGeneric = /\b(cool|thing|stuff|vibe|aesthetic|random|whatever|bored|boring)\b/i.test(clean);
    const confidenceAverage = (confidence.directionConfidence + confidence.conceptConfidence + confidence.executionConfidence) / 3;
    const uncertaintyScore = clamp01(
        1
        - confidenceAverage * 0.7
        + (decision.missingNeeds.length / DECISION_KEYS.length) * 0.2
        + (creativeState === "blank" || creativeState === "searching" ? 0.18 : 0)
        + (isGeneric ? 0.18 : 0)
    );
    const attentionCost = clamp01(
        0.16
        + confidence.executionConfidence * 0.3
        + confidence.directionConfidence * 0.18
        + (words > 18 ? 0.12 : 0)
        + (creativeState === "refining" || creativeState === "finished" ? 0.18 : 0)
        + (clean.endsWith(",") ? 0.08 : 0)
    );

    let reason: InterventionReason = "none";
    if (creativeState === "refining" || creativeState === "finished" || confidence.executionConfidence >= HIGH_CONFIDENCE_THRESHOLD) {
        reason = "arrival";
    } else if (isGeneric || (words > 14 && decision.missingNeeds.length >= 4)) {
        reason = "overloaded";
    } else if (creativeState === "blank" || words <= 1) {
        reason = "hesitation";
    } else if (getConfidenceMode(confidence) === "low" || creativeState === "searching") {
        reason = "branch_confusion";
    }

    let expectedMomentumGain = 0;
    if (reason === "hesitation") expectedMomentumGain = 0.74;
    if (reason === "branch_confusion") expectedMomentumGain = 0.66;
    if (reason === "overloaded") expectedMomentumGain = 0.78;
    if (reason === "arrival") expectedMomentumGain = confidence.executionConfidence >= 0.86 ? 0.36 : 0.62;
    if (reason === "none") expectedMomentumGain = Math.max(0.08, uncertaintyScore * 0.45);
    if (commaCount >= 5 && confidence.executionConfidence < 0.7) expectedMomentumGain += 0.08;
    expectedMomentumGain = clamp01(expectedMomentumGain);

    let interventionLevel: 0 | 1 | 2 | 3 = 0;
    if (reason === "overloaded") interventionLevel = 3;
    else if (reason === "hesitation" || reason === "branch_confusion") interventionLevel = 2;
    else if (reason === "arrival") interventionLevel = confidence.executionConfidence >= 0.86 ? 1 : 3;
    else interventionLevel = 1;

    return {
        uncertaintyScore,
        attentionCost,
        expectedMomentumGain,
        interventionLevel,
        reason,
    };
}

function parseDecisionList(raw: unknown, fallback: DecisionNeed[]) {
    if (!Array.isArray(raw)) return fallback;
    const needs = raw.filter(isDecisionNeed).slice(0, 7);
    return needs.length ? needs : fallback;
}

function buildCadenceState(acceptedCount: number): CadenceState {
    const currentPhase = phaseForCount(acceptedCount);
    return {
        acceptedCount,
        currentPhase,
        phraseLengthBias: currentPhase === "seed" || currentPhase === "build" ? "short" : "medium",
        escalationLevel: clamp01(acceptedCount / 3),
    };
}

function phaseForCount(acceptedCount: number): CadencePhase {
    if (acceptedCount <= 0) return "seed";
    if (acceptedCount === 1) return "build";
    if (acceptedCount === 2) return "twist";
    return "resolve";
}

function isCadencePhase(value: unknown): value is CadencePhase {
    return value === "seed" || value === "build" || value === "twist" || value === "resolve";
}

function isArrivalMove(value: unknown): value is ArrivalMove {
    return value === "continue" || value === "tighten" || value === "sharpen" || value === "generate";
}

function isCreativeState(value: unknown): value is CreativeState {
    return value === "blank"
        || value === "searching"
        || value === "exploring"
        || value === "committing"
        || value === "refining"
        || value === "finished";
}

function isInterventionLevel(value: unknown): value is 0 | 1 | 2 | 3 {
    return value === 0 || value === 1 || value === 2 || value === 3;
}

function isInterventionReason(value: unknown): value is InterventionReason {
    return value === "hesitation"
        || value === "looping"
        || value === "branch_confusion"
        || value === "arrival"
        || value === "overloaded"
        || value === "none";
}

function buildTasteGravity(vector: TasteVector, recentTrajectory: TasteMutation[]): TasteGravity {
    const ranked = [...MUTATION_KEYS].sort((a, b) => vector[b] - vector[a]);
    const lastThree = recentTrajectory.slice(0, 3);
    const repeatedRecent = Math.max(0, ...MUTATION_KEYS.map((axis) => lastThree.filter((item) => item === axis).length));
    const concentration = clamp01((vector[ranked[0]] ?? 0) - (vector[ranked[2]] ?? 0));
    const noveltyPressure = clamp01(0.22 + concentration * 0.55 + Math.max(0, repeatedRecent - 1) * 0.24);
    return {
        dominantAxes: ranked.slice(0, 3),
        suppressedAxes: ranked.slice(-4).reverse(),
        recentTrajectory,
        noveltyPressure,
        coherencePressure: clamp01(0.82 - noveltyPressure * 0.42 + Math.min(0.16, recentTrajectory.length * 0.025)),
    };
}

function parseAxisList(raw: unknown, fallback: TasteMutation[]) {
    if (!Array.isArray(raw)) return fallback;
    const axes = raw.filter(isMutation).slice(0, 8);
    return axes.length ? axes : fallback;
}

function compactTasteVector(vector: TasteVector) {
    return MUTATION_KEYS.reduce((acc, key) => {
        const value = vector[key];
        if (value >= 0.12) acc[key] = Math.round(value * 100) / 100;
        return acc;
    }, {} as Partial<TasteVector>);
}

function isMutation(value: unknown): value is TasteMutation {
    return typeof value === "string" && MUTATIONS.has(value);
}

function isDecisionNeed(value: unknown): value is DecisionNeed {
    return typeof value === "string" && DECISION_KEYS.includes(value as DecisionNeed);
}

function wordCount(value: string) {
    return value.replace(/^[,;:]\s*/, "").replace(/-/g, " ").split(/\s+/).filter(Boolean).length;
}

function isKeywordSoup(value: string) {
    const text = value.replace(/^,\s*/, "");
    const commaCount = (text.match(/,/g) ?? []).length;
    if (commaCount > 1) return true;
    if (commaCount === 1 && !/\b(and|with|from|under|inside|over|through|woven|grown|lit)\b/i.test(text)) return true;
    return /\b(style|aesthetic|vibes|highly|extremely|beautiful|quality|detailed)\b/i.test(text);
}

function tokenSet(value: string) {
    return new Set(value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2 && !["with", "and", "the", "for", "from", "style"].includes(token)));
}

function similarity(a: Set<string>, b: Set<string>) {
    if (!a.size || !b.size) return 0;
    let intersection = 0;
    a.forEach((token) => {
        if (b.has(token)) intersection += 1;
    });
    return intersection / (a.size + b.size - intersection);
}

function clamp01(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function isLastWordComplete(prompt: string): boolean {
    const trimmed = prompt.trimEnd();
    if (trimmed.length === 0) return true;

    if (/\s|[.,;:!?]$/.test(prompt)) {
        return true;
    }

    const words = trimmed.toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1];

    const targetKeywords = ["bee", "knight", "queen", "forest", "castle", "space", "star", "planet", "astronaut"];
    return targetKeywords.includes(lastWord);
}
