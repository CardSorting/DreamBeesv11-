/**
 * [LAYER: INFRASTRUCTURE]
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconHome, IconImage, IconLayers, IconLoader, IconMagic, IconSparkles, IconUser, IconZap } from '../icons';
import GenerationTimeEstimator from '../components/GenerationTimeEstimator';

const promptIdeaGroups = [
    {
        id: 'starter',
        label: 'Quick starts',
        helper: 'Friendly first prompts',
        ideas: [
            'A cozy bee studio inside a giant sunflower, soft morning light',
            'A friendly robot painting clouds above a peaceful city',
            'A storybook cottage bakery shaped like a honeycomb'
        ]
    },
    {
        id: 'portrait',
        label: 'Characters',
        helper: 'People, mascots, avatars',
        ideas: [
            'A cheerful fantasy shopkeeper with warm lighting, detailed outfit, welcoming smile',
            'A cute bee mascot holding a tiny paintbrush, playful sticker style',
            'A cinematic portrait of an explorer in a glowing crystal cave'
        ]
    },
    {
        id: 'product',
        label: 'Products',
        helper: 'Mockups and polished shots',
        ideas: [
            'A dreamy product photo of lavender tea on a moonlit table',
            'A premium honey jar on a marble counter, golden reflections, soft studio light',
            'A cozy candle brand mockup with flowers, warm shadows, clean background'
        ]
    }
] as const;

type PromptIdeaGroupId = typeof promptIdeaGroups[number]['id'];

const creationGoals = [
    {
        id: 'blank',
        label: 'Start from scratch',
        helper: 'Best when you already know the exact image you want.',
        prompt: ''
    },
    {
        id: 'character',
        label: 'Make a character',
        helper: 'Avatars, mascots, portraits, and story characters.',
        prompt: 'A friendly character portrait with expressive eyes, detailed outfit, soft lighting, clean background'
    },
    {
        id: 'scene',
        label: 'Build a scene',
        helper: 'Places, fantasy worlds, rooms, and environments.',
        prompt: 'A cozy magical workshop filled with glowing jars, warm light, tiny details, storybook illustration style'
    },
    {
        id: 'product',
        label: 'Show a product',
        helper: 'Brand mockups, product shots, and polished displays.',
        prompt: 'A premium product photo on a clean studio background, soft shadows, elegant lighting, high detail'
    }
] as const;

const promptTips = [
    'Subject: who or what should be in the image',
    'Style: watercolor, cinematic, 3D, anime, photo, or sketch',
    'Details: colors, mood, lighting, background, and composition'
];

const promptChecklist = [
    { label: 'Subject', match: (prompt: string) => prompt.trim().length > 0, help: 'Say what should appear.' },
    { label: 'Style', match: (prompt: string) => /photo|cinematic|watercolor|anime|3d|illustration|sketch|painting|realistic|storybook/i.test(prompt), help: 'Add a look or medium.' },
    { label: 'Mood', match: (prompt: string) => /warm|soft|dark|bright|dreamy|cozy|dramatic|peaceful|playful|moody|glowing/i.test(prompt), help: 'Add a feeling or lighting cue.' },
    { label: 'Details', match: (prompt: string) => prompt.trim().split(/\s+/).length >= 10, help: 'A few extra details help.' }
];

const workflowSteps = [
    { label: 'Describe', help: 'Write the idea' },
    { label: 'Choose style', help: 'Pick a model' },
    { label: 'Generate', help: 'Create image' },
    { label: 'Review', help: 'Save or reuse' }
];

export default function Generator() {
    const [prompt, setPrompt] = useState('');
    const [activeIdeaGroup, setActiveIdeaGroup] = useState<PromptIdeaGroupId>('starter');
    const [showPromptGuide, setShowPromptGuide] = useState(true);
    const { selectedModel, generate, generating, localHistory, currentUser, isOffline, availableModels, userTier, zaps } = useLite();

    const cleanPrompt = prompt.trim();
    const latestImage = localHistory[0];
    const recentImages = localHistory.slice(1, 9);
    const promptCharacterCount = prompt.length;
    const activePromptIdeaGroup = promptIdeaGroups.find(group => group.id === activeIdeaGroup) || promptIdeaGroups[0];
    const promptScore = promptChecklist.filter(item => item.match(prompt)).length;
    const readyChecklist = [
        { label: 'Signed in', ready: Boolean(currentUser), action: '/auth', actionLabel: 'Sign in' },
        { label: 'Style selected', ready: Boolean(selectedModel), action: '/', actionLabel: 'Choose style' },
        { label: 'Prompt added', ready: Boolean(cleanPrompt), action: '#image-prompt', actionLabel: 'Write prompt' },
        { label: 'Has credits', ready: zaps === 'unlimited' || zaps > 0, action: '/profile', actionLabel: 'Upgrade' },
        { label: 'Online', ready: !isOffline, action: '', actionLabel: 'Reconnect' }
    ];
    const readyCount = readyChecklist.filter(item => item.ready).length;
    const hasCredits = zaps === 'unlimited' || zaps > 0;
    const canGenerate = Boolean(cleanPrompt && selectedModel && currentUser && !isOffline && !generating && hasCredits);
    const activeWorkflowIndex = generating ? 2 : latestImage && !cleanPrompt ? 3 : cleanPrompt && selectedModel ? 2 : cleanPrompt ? 1 : 0;

    const greeting = useMemo(() => {
        const firstName = currentUser?.displayName?.split(' ')[0];
        return firstName ? `Hi ${firstName}, what are we creating today?` : 'What are we creating today?';
    }, [currentUser]);

    const generateLabel = generating
        ? 'Creating image...'
        : isOffline
            ? 'Reconnect to create'
            : !currentUser
                ? 'Sign in to create'
                : !selectedModel
                    ? 'Choose a style first'
                    : !hasCredits
                        ? 'Out of credits'
                        : cleanPrompt
                            ? 'Create image'
                            : 'Describe your image first';
    const readinessLabel = canGenerate
        ? 'Ready to create'
        : `${readyCount} of ${readyChecklist.length} steps ready`;
    const nextStep = generating
        ? { kind: 'wait', label: 'Creating now', title: 'Image is being created', helper: 'Keep DreamBees open while the result is saved to your history.' }
        : isOffline
            ? { kind: 'blocked', label: 'Reconnect', title: 'Reconnect to continue', helper: 'DreamBees needs an internet connection before it can create a new image.' }
            : !currentUser
                ? { kind: 'route', label: 'Sign in', title: 'Sign in to create', helper: 'Sign in first so your generation can be created and saved.', to: '/auth' }
                : !selectedModel
                    ? { kind: 'route', label: 'Choose style', title: 'Choose a style', helper: 'Select a visual style for your next image.', to: '/' }
                    : !hasCredits
                        ? { kind: 'route', label: 'Upgrade', title: 'Out of credits', helper: 'You have used all your generations for this period. Upgrade to Pro for unlimited zaps.', to: '/profile' }
                        : !cleanPrompt
                            ? { kind: 'anchor', label: 'Write prompt', title: 'Describe your image', helper: 'Start with a short sentence or use one of the templates below.', to: '#image-prompt' }
                            : { kind: 'submit', label: 'Create image', title: 'Everything is ready', helper: 'Review the description and press Create image when you are ready.' };

    const handleGenerate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!canGenerate) return;
        await generate(cleanPrompt);
        setPrompt('');
    };

    const applyGoalPrompt = (starterPrompt: string) => {
        if (!starterPrompt) {
            setPrompt('');
            return;
        }
        setPrompt(current => current.trim() ? current : starterPrompt);
    };

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate();
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [cleanPrompt, generating, canGenerate]);

    return (
        <div className="generator-page fade-in">
            <header className="generator-topbar" aria-label="Generation header">
                <div>
                    <nav className="breadcrumbs" aria-label="Breadcrumb">
                        <Link to="/">Explore</Link>
                        <span>/</span>
                        <span>Create</span>
                    </nav>
                    <h1>Create an image</h1>
                    <p>Describe your idea and select a visual direction below.</p>
                </div>

                <div className="topbar-actions" aria-label="Quick navigation">
                    {selectedModel && (
                        <div className="active-style-pill" aria-label={`Active style: ${selectedModel.name}`}>
                            <IconSparkles size={12} />
                            <span>{selectedModel.name}</span>
                        </div>
                    )}
                    <Link to="/" className="secondary-action">
                        <IconLayers size={16} />
                        Styles
                    </Link>
                    <Link to="/profile" className="secondary-action">
                        <IconUser size={16} />
                        History
                    </Link>
                </div>
            </header>

            <main className="generator-layout">
                <section className="control-panel" aria-labelledby="prompt-heading">
                    <form onSubmit={handleGenerate} className="prompt-form">
                        <div className="template-pills-row" aria-label="Starter templates">
                            {creationGoals.map(goal => (
                                <button
                                    type="button"
                                    key={goal.id}
                                    className="template-pill"
                                    onClick={() => applyGoalPrompt(goal.prompt)}
                                    title={goal.helper}
                                >
                                    {goal.label}
                                </button>
                            ))}
                        </div>

                        <textarea
                            id="image-prompt"
                            placeholder="Example: A warm watercolor illustration of a tiny bee building a cozy studio inside a flower..."
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                            aria-describedby="prompt-help prompt-count prompt-strength"
                            maxLength={1000}
                        />

                        <div className="prompt-strength-bar" id="prompt-strength" aria-label={`Prompt score: ${promptScore} of ${promptChecklist.length}`}>
                            <div className="strength-fill" style={{ width: `${(promptScore / promptChecklist.length) * 100}%` }} />
                        </div>

                        <div className="prompt-meta">
                            <div className="prompt-meta-left">
                                <span id="prompt-help">Enter to generate, Shift+Enter for new line.</span>
                                <span className="meta-dot">•</span>
                                <button
                                    type="button"
                                    className="meta-help-toggle"
                                    onClick={() => setShowPromptGuide(value => !value)}
                                    aria-expanded={showPromptGuide}
                                >
                                    {showPromptGuide ? 'Hide checklist' : 'Show checklist'}
                                </button>
                            </div>
                            <span id="prompt-count">{promptCharacterCount}/1000</span>
                        </div>

                        {showPromptGuide && (
                            <div className="prompt-coach-flat" aria-label="Prompt quality checklist">
                                {promptChecklist.map(item => {
                                    const isReady = item.match(prompt);
                                    return (
                                        <span className={`coach-item ${isReady ? 'ready' : ''}`} key={item.label}>
                                            <span className="coach-status">{isReady ? '✓' : '•'}</span>
                                            <strong>{item.label}</strong>
                                            <span className="coach-help">{item.help}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        <div className="idea-picker-flat" aria-label="Prompt examples">
                            <div className="idea-tabs-row" role="tablist" aria-label="Example categories">
                                <span className="idea-label">Examples:</span>
                                {promptIdeaGroups.map(group => (
                                    <button
                                        type="button"
                                        key={group.id}
                                        role="tab"
                                        aria-selected={activeIdeaGroup === group.id}
                                        className={`idea-tab-tag ${activeIdeaGroup === group.id ? 'active' : ''}`}
                                        onClick={() => setActiveIdeaGroup(group.id)}
                                    >
                                        {group.label}
                                    </button>
                                ))}
                            </div>
                            <div className="idea-tags-row">
                                {activePromptIdeaGroup.ideas.map(idea => (
                                    <button type="button" key={idea} className="idea-tag-btn" onClick={() => setPrompt(idea)}>
                                        {idea}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <GenerationTimeEstimator 
                            generating={generating}
                            showProgressBar={true}
                        />

                        <div className="action-row-flat">
                            <Link to="/" className="style-selector-pill" aria-label={`Selected style: ${selectedModel?.name || 'Choose style'}`}>
                                <IconMagic size={14} />
                                <span>Style: <strong>{selectedModel?.name || 'Choose style'}</strong></span>
                            </Link>

                            <button type="submit" className="generate-button" disabled={!canGenerate} aria-busy={generating}>
                                {generating ? (
                                    <><IconLoader size={18} /> Creating...</>
                                ) : (
                                    <><IconZap size={18} fill={zaps === 'unlimited' ? '#fbbf24' : 'currentColor'} /> {generateLabel} {hasCredits && zaps !== 'unlimited' && `(${zaps})`}</>
                                )}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="preview-column" aria-label="Image preview and recent creations">
                    <div className="preview-card">
                        <div className="preview-header">
                            <div>
                                <span>Preview</span>
                                <strong>{latestImage ? 'Latest creation' : 'Ready when you are'}</strong>
                            </div>
                            <div className="preview-badges">
                                {selectedModel?.name && <div className="model-pill">{selectedModel.name}</div>}
                                <div className={`model-pill readiness-pill ${canGenerate ? 'ready' : ''}`}>{readinessLabel}</div>
                            </div>
                        </div>

                        <div className="preview-stage">
                            <AnimatePresence mode="wait">
                                {generating ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="generation-state"
                                        role="status"
                                        aria-live="polite"
                                    >
                                        <div className="progress-orbit">
                                            <IconMagic size={44} fill="currentColor" />
                                        </div>
                                        <h3>Creating your image</h3>
                                        <p>This can take a moment. You can keep DreamBees open while it works.</p>
                                        <div className="generation-steps" aria-label="Generation progress details">
                                            <span>Checking prompt</span>
                                            <span>Applying style</span>
                                            <span>Saving result</span>
                                        </div>
                                    </motion.div>
                                ) : latestImage ? (
                                    <motion.figure
                                        key={latestImage.id}
                                        initial={{ opacity: 0, scale: 1.02 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="result-figure"
                                    >
                                        <img src={getOptimizedImageUrl(latestImage.imageUrl) || ''} alt={latestImage.prompt || 'Generated image'} />
                                        <figcaption>
                                            <span>Latest prompt</span>
                                            {latestImage.prompt}
                                        </figcaption>
                                    </motion.figure>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="empty-preview"
                                    >
                                        <div><IconImage size={46} /></div>
                                        <h3>Your image will appear here</h3>
                                        <p>Start with an example, write your own idea, or choose a style first if you want a specific look.</p>
                                        <div className="empty-actions-inline">
                                            <a href="#image-prompt">Write prompt</a>
                                            <Link to="/">Choose style</Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                </section>
            </main>

            <section className="recent-section" aria-labelledby="recent-heading">
                <div className="recent-heading-row">
                    <div>
                        <span className="section-kicker"><IconLayers size={14} /> Library</span>
                        <h2 id="recent-heading">Recent creations</h2>
                    </div>
                    <Link to="/profile">View full history</Link>
                </div>

                {recentImages.length > 0 ? (
                    <div className="recent-grid">
                        {recentImages.map((item, idx) => (
                            <motion.article
                                key={item.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="recent-card"
                            >
                                <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt={item.prompt || 'Recent generated image'} />
                                <p>{item.prompt}</p>
                            </motion.article>
                        ))}
                    </div>
                ) : (
                    <div className="recent-empty">
                        <IconImage size={20} />
                        <span>Your recent images will collect here after you generate more than one.</span>
                    </div>
                )}
            </section>

            <style>{`
                .generator-page { min-height: 100vh; width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 24px 0 132px; position: relative; }
                .generator-mesh { position: fixed; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.34; z-index: -1; }
                .mesh-orb { position: absolute; border-radius: 999px; filter: blur(110px); animation: generatorDrift 22s ease-in-out infinite alternate; }
                .orb-one { width: 520px; height: 520px; top: -180px; right: -120px; background: rgba(139, 92, 246, 0.28); }
                .orb-two { width: 440px; height: 440px; bottom: 4%; left: -160px; background: rgba(245, 158, 11, 0.14); animation-delay: -6s; }
                .orb-three { width: 360px; height: 360px; top: 36%; left: 36%; background: rgba(168, 85, 247, 0.12); animation-delay: -12s; }

                .generator-topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
                .breadcrumbs { display: flex; align-items: center; gap: 8px; color: var(--color-zinc-500); font-size: 0.78rem; font-weight: 800; margin-bottom: 12px; }
                .breadcrumbs a, .recent-heading-row a { color: var(--color-zinc-400); text-decoration: none; }
                .breadcrumbs a:hover { color: white; }
                .generator-topbar h1 { font-size: clamp(2rem, 5vw, 4.25rem); letter-spacing: -0.07em; margin-bottom: 10px; }
                .generator-topbar p { max-width: 650px; color: var(--color-zinc-400); font-weight: 650; }
                .topbar-actions { display: flex; gap: 10px; flex-shrink: 0; align-items: center; }
                .active-style-pill { display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border-radius: 14px; background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.28); color: white; font-size: 0.8rem; font-weight: 800; min-height: 42px; }
                .active-style-pill svg { color: var(--color-accent); }
                .secondary-action { min-height: 42px; padding: 0 14px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.09); border-radius: 14px; color: white; text-decoration: none; background: rgba(255,255,255,0.035); font-size: 0.82rem; font-weight: 900; }
                .secondary-action:hover { border-color: rgba(139, 92, 246, 0.5); background: rgba(139, 92, 246, 0.12); }

                .ready-state { padding: 10px 14px; border-radius: 99px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }
                .status-pill { display: inline-block; padding: 4px 12px; border-radius: 99px; color: var(--color-zinc-400); font-size: 0.75rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; }
                .status-pill.ready { color: white; background: rgba(34, 197, 94, 0.15); border-color: rgba(34, 197, 94, 0.25); }

                .compact-goal-panel { margin-bottom: 14px; }
                .compact-goal-panel h2 { font-size: 1rem; letter-spacing: -0.04em; margin: 4px 0 8px; }
                .goal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
                .goal-grid button { min-height: 48px; padding: 8px; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: var(--color-zinc-400); background: rgba(255,255,255,0.025); font-size: 0.74rem; font-weight: 900; text-align: center; cursor: pointer; }
                .goal-grid button:hover { color: white; border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.1); }

                .generator-layout { display: grid; grid-template-columns: minmax(340px, 0.85fr) minmax(360px, 1.15fr); gap: 20px; align-items: start; }
                .control-panel { padding: 0; position: sticky; top: 16px; }
                .preview-card { padding: 0; }
                .tips-card { padding: 20px 0 0; border-top: 1px solid rgba(255,255,255,0.08); border-radius: 0; }
                .recent-empty { padding: 24px; border: 1px dashed rgba(255,255,255,0.12); border-radius: 18px; background: rgba(255,255,255,0.015); }
                .panel-heading { margin-bottom: 10px; }
                .section-kicker { display: inline-flex; align-items: center; gap: 6px; color: var(--color-accent); font-size: 0.65rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.12em; }
                .panel-heading h2, .tips-card h2, .recent-heading-row h2 { font-size: 1.2rem; margin: 6px 0; letter-spacing: -0.04em; }
                .panel-heading p, .tips-card li, .safe-helper, .prompt-meta, .next-step-box p { color: var(--color-zinc-400); font-size: 0.78rem; font-weight: 650; }
                .guide-toggle { margin-top: 8px; border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; background: rgba(255,255,255,0.035); color: white; padding: 6px 10px; font-size: 0.7rem; font-weight: 900; cursor: pointer; }

                .prompt-form { display: flex; flex-direction: column; gap: 10px; }
                .prompt-form textarea { width: 100%; min-height: 130px; resize: vertical; border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; background: rgba(255,255,255,0.035); color: white; padding: 12px; font-size: 0.9rem; line-height: 1.4; outline: none; }
                .prompt-form textarea:focus { border-color: rgba(139, 92, 246, 0.8); box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.14); }
                .prompt-meta { display: flex; justify-content: space-between; gap: 8px; margin-top: -4px; font-size: 0.71rem; align-items: center; }
                .prompt-meta-left { display: flex; align-items: center; gap: 8px; }
                .meta-dot { color: var(--color-zinc-700); font-weight: 900; }
                .meta-help-toggle { background: none; border: none; color: var(--color-accent); font-size: 0.71rem; font-weight: 850; cursor: pointer; text-decoration: underline; padding: 0; }
                .meta-help-toggle:hover { color: white; }

                .template-pills-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
                .template-pill { display: inline-flex; align-items: center; justify-content: center; min-height: 32px; padding: 0 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; background: rgba(255,255,255,0.025); color: var(--color-zinc-400); font-size: 0.74rem; font-weight: 850; cursor: pointer; transition: all 0.2s ease; }
                .template-pill:hover { color: white; border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.1); }

                .prompt-strength-bar { height: 2px; background: rgba(255,255,255,0.06); border-radius: 99px; margin-top: -6px; overflow: hidden; }
                .strength-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent), var(--color-soft-gold)); transition: width 0.3s ease; }

                .prompt-coach-flat { display: flex; flex-wrap: wrap; gap: 8px 16px; padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); }
                .coach-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; color: var(--color-zinc-400); }
                .coach-item.ready { color: white; }
                .coach-status { font-weight: 900; color: var(--color-accent); }
                .coach-item.ready .coach-status { color: #4ade80; }
                .coach-help { color: var(--color-zinc-500); font-weight: 650; }
                .coach-item.ready .coach-help { color: var(--color-zinc-400); }

                .idea-picker-flat { display: flex; flex-direction: column; gap: 8px; }
                .idea-tabs-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
                .idea-label { font-size: 0.72rem; font-weight: 850; color: var(--color-zinc-500); text-transform: uppercase; letter-spacing: 0.05em; margin-right: 4px; }
                .idea-tab-tag { display: inline-flex; align-items: center; min-height: 26px; padding: 0 10px; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.1); background: transparent; color: var(--color-zinc-400); font-size: 0.72rem; font-weight: 800; cursor: pointer; transition: all 0.2s ease; }
                .idea-tab-tag:hover { color: white; border-color: rgba(255,255,255,0.2); }
                .idea-tab-tag.active { color: white; border-style: solid; border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.12); }
                .idea-tags-row { display: flex; flex-wrap: wrap; gap: 6px; }
                .idea-tag-btn { border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); color: var(--color-zinc-400); padding: 5px 9px; border-radius: 10px; font-size: 0.72rem; font-weight: 750; cursor: pointer; text-align: left; transition: all 0.2s ease; }
                .idea-tag-btn:hover { color: white; border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.08); }

                .action-row-flat { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; }
                .style-selector-pill { display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border-radius: 14px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); color: var(--color-zinc-300); text-decoration: none; font-size: 0.8rem; font-weight: 800; min-height: 48px; transition: all 0.2s ease; flex-shrink: 0; }
                .style-selector-pill:hover { border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.08); color: white; }
                .style-selector-pill svg { color: var(--color-accent); }

                .generate-button { flex: 1; min-height: 48px; border: none; border-radius: 14px; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); color: white; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 950; font-size: 0.92rem; cursor: pointer; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.15); transition: all 0.2s ease; }
                .generate-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(139, 92, 246, 0.25); }
                .generate-button:disabled { cursor: not-allowed; color: var(--color-zinc-500); background: rgba(255,255,255,0.05); box-shadow: none; }

                /* ─── Generation Time Estimator (Industry-Standard) ────────── */
                .generation-time {
                    padding: 12px 14px;
                    border-radius: 16px;
                    background: rgba(139, 92, 246, 0.06);
                    border: 1px solid rgba(139, 92, 246, 0.14);
                    margin-top: 10px;
                    display: grid;
                    gap: 10px;
                }

                /* Stage Indicator Bar — dots + connectors like YouTube/Midjourney */
                .stage-indicator-bar {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0;
                }

                .stage-dot {
                    width: 14px;
                    height: 14px;
                    border-radius: 999px;
                    display: grid;
                    place-items: center;
                    background: rgba(255,255,255,0.08);
                    border: 1.5px solid rgba(255,255,255,0.15);
                    flex-shrink: 0;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .stage-dot.complete {
                    background: rgba(34, 197, 94, 0.25);
                    border-color: rgba(34, 197, 94, 0.5);
                    color: #4ade80;
                }

                .stage-dot.active {
                    background: rgba(139, 92, 246, 0.25);
                    border-color: var(--color-accent);
                    box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
                }

                .stage-pulse {
                    display: block;
                    width: 6px;
                    height: 6px;
                    border-radius: 999px;
                    background: var(--color-accent);
                }

                .stage-pending {
                    display: block;
                    width: 4px;
                    height: 4px;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.2);
                }

                .stage-connector {
                    flex: 1;
                    height: 2px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 1px;
                    overflow: hidden;
                    min-width: 16px;
                    max-width: 48px;
                }

                .stage-connector.complete {
                    background: rgba(34, 197, 94, 0.15);
                }

                .connector-fill {
                    width: 100%;
                    height: 100%;
                    background: rgba(34, 197, 94, 0.6);
                    transform-origin: left;
                }

                /* Stage Labels — current stage + ETA message */
                .stage-labels {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                }

                .stage-label.active-stage {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.72rem;
                    font-weight: 900;
                    color: white;
                }

                .stage-emoji {
                    font-size: 0.85rem;
                    line-height: 1;
                }

                .eta-message {
                    font-size: 0.7rem;
                    font-weight: 750;
                    color: var(--color-zinc-400);
                    text-align: right;
                }

                /* Progress Section — bar + percentage */
                .progress-section {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .time-progress-track {
                    flex: 1;
                    height: 6px;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.08);
                    overflow: hidden;
                    position: relative;
                }

                .time-progress-fill {
                    height: 100%;
                    border-radius: 999px;
                    background: linear-gradient(90deg, var(--color-accent), #c084fc, var(--color-accent));
                    background-size: 200% 100%;
                    position: relative;
                }

                .progress-shimmer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(255,255,255,0.15) 50%,
                        transparent 100%
                    );
                    animation: shimmer 2s ease-in-out infinite;
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .progress-percentage {
                    font-size: 0.68rem;
                    font-weight: 950;
                    color: var(--color-zinc-300);
                    min-width: 36px;
                    text-align: right;
                }

                /* Time Metrics Row — elapsed badge + confidence indicator */
                .time-metrics-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                }

                .elapsed-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.66rem;
                    font-weight: 850;
                    color: var(--color-zinc-300);
                    background: rgba(255,255,255,0.05);
                    padding: 4px 9px;
                    border-radius: 8px;
                }

                .confidence-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.6rem;
                    font-weight: 800;
                    color: var(--color-zinc-400);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 3px 8px;
                    border-radius: 999px;
                    transition: border-color 0.3s ease;
                }

                .preview-column { display: flex; flex-direction: column; gap: 12px; }
  +++++++ REPLACE
                .preview-card { padding: 12px; }
                .preview-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 4px 4px 10px; }
                .preview-header span { display: block; color: var(--color-zinc-500); font-size: 0.68rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.12em; }
                .preview-header strong { color: white; font-size: 0.9rem; }
                .preview-badges { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 6px; }
                .model-pill { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; padding: 6px 10px; color: var(--color-zinc-400); font-size: 0.72rem; font-weight: 850; }
                .readiness-pill.ready { color: white; border-color: rgba(34, 197, 94, 0.35); background: rgba(34, 197, 94, 0.1); }
                .preview-stage { min-height: 480px; aspect-ratio: 1 / 1; border-radius: 22px; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative; background: radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.16), rgba(255,255,255,0.025) 48%, rgba(0,0,0,0.18)); border: 1px solid rgba(255,255,255,0.07); }
                .generation-state, .empty-preview { text-align: center; max-width: 360px; padding: 24px; }
                .generation-state h3, .empty-preview h3 { font-size: 1.2rem; margin: 10px 0 6px; }
                .progress-orbit, .empty-preview > div { width: 72px; height: 72px; margin: 0 auto; border-radius: 24px; display: grid; place-items: center; color: var(--color-accent); background: rgba(139, 92, 246, 0.12); }
                .progress-orbit { animation: breathe 2.2s ease-in-out infinite; }
                .generation-steps, .empty-actions-inline { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
                .generation-steps span, .empty-actions-inline a { border-radius: 999px; padding: 7px 9px; color: white; text-decoration: none; font-size: 0.72rem; font-weight: 900; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08); }
                .result-figure { width: 100%; height: 100%; position: relative; }
                .result-figure img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .result-figure figcaption { position: absolute; left: 14px; right: 14px; bottom: 14px; padding: 12px 14px; border-radius: 16px; background: rgba(0,0,0,0.58); backdrop-filter: blur(18px); color: white; font-size: 0.82rem; font-weight: 700; line-height: 1.35; }
                .result-figure figcaption span { display: block; color: var(--color-zinc-300); font-size: 0.66rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }

                .tips-card { padding: 12px; }
                .tips-card h2 { font-size: 1rem; }
                .tips-card ul { list-style: none; display: grid; gap: 6px; margin-top: 8px; }
                .tips-card li { position: relative; padding-left: 16px; }
                .tips-card li::before { content: ''; position: absolute; left: 0; top: 0.65em; width: 5px; height: 5px; border-radius: 999px; background: var(--color-accent); box-shadow: 0 0 12px rgba(139, 92, 246, 0.8); }
                .next-step-box { margin-top: 10px; padding: 10px; border-radius: 14px; background: rgba(139, 92, 246, 0.09); border: 1px solid rgba(139, 92, 246, 0.18); }
                .next-step-box strong { color: white; font-size: 0.88rem; }
                .next-step-box p { margin-top: 4px; font-size: 0.76rem; }

                .recent-section { margin-top: 18px; }
                .recent-heading-row { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
                .recent-heading-row h2 { margin-bottom: 0; font-size: 1rem; }
                .recent-heading-row a { font-size: 0.78rem; font-weight: 950; }
                .recent-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
                .recent-card { border-radius: 16px; overflow: hidden; min-height: 160px; }
                .recent-card img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; }
                .recent-card p { padding: 8px; color: var(--color-zinc-400); font-size: 0.72rem; line-height: 1.25; font-weight: 700; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .recent-empty { display: flex; align-items: center; gap: 8px; padding: 12px; color: var(--color-zinc-400); font-weight: 750; font-size: 0.74rem; }

                @keyframes generatorDrift { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(38px, 28px, 0) scale(1.08); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }

                @media (max-width: 980px) {
                    .generator-topbar { flex-direction: column; }
                    .workflow-card, .quick-route-card { grid-template-columns: repeat(2, 1fr); }
                    .next-action-card, .goal-panel { grid-template-columns: 1fr; }
                    .goal-grid { grid-template-columns: repeat(2, 1fr); }
                    .generator-layout { grid-template-columns: 1fr; }
                    .control-panel { position: static; }
                    .preview-stage { min-height: auto; }
                }

                @media (max-width: 620px) {
                    .generator-page { width: min(100% - 24px, 1180px); padding-top: 16px; }
                    .topbar-actions, .recent-heading-row { align-items: stretch; width: 100%; }
                    .topbar-actions { display: grid; grid-template-columns: 1fr 1fr; }
                    .secondary-action { justify-content: center; }
                    .workflow-card, .quick-route-card, .goal-grid, .prompt-coach, .idea-tabs { grid-template-columns: 1fr; }
                    .workflow-step:not(.active) { display: none; }
                    .next-action-controls a, .next-action-controls button { width: 100%; }
                    .action-row-flat { flex-direction: column; align-items: stretch; }
                    .style-selector-pill { justify-content: center; }
                    .prompt-meta, .recent-heading-row { flex-direction: column; align-items: flex-start; }
                    .recent-grid { grid-template-columns: repeat(2, 1fr); }
                    .preview-header { align-items: flex-start; flex-direction: column; }
                    .preview-badges, .model-pill { width: 100%; }
                    .model-pill { max-width: 100%; }
                }
            `}</style>
        </div>
    );
}