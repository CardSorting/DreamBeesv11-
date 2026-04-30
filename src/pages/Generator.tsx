import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconHome, IconImage, IconLayers, IconLoader, IconMagic, IconSparkles, IconUser, IconZap } from '../icons';

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
    const { selectedModel, generate, generating, localHistory, currentUser, isOffline, availableModels } = useLite();

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
        { label: 'Online', ready: !isOffline, action: '', actionLabel: 'Reconnect' }
    ];
    const readyCount = readyChecklist.filter(item => item.ready).length;
    const canGenerate = Boolean(cleanPrompt && selectedModel && currentUser && !isOffline && !generating);
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
                    ? { kind: 'route', label: 'Choose style', title: 'Choose an image style', helper: 'Pick a visual style so the result looks more predictable.', to: '/' }
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
            <div className="generator-mesh" aria-hidden="true">
                <div className="mesh-orb orb-one" />
                <div className="mesh-orb orb-two" />
                <div className="mesh-orb orb-three" />
            </div>

            <header className="generator-topbar" aria-label="Create page header">
                <div>
                    <nav className="breadcrumbs" aria-label="Breadcrumb">
                        <Link to="/">Explore</Link>
                        <span>/</span>
                        <span>Create</span>
                    </nav>
                    <h1>Create an image</h1>
                    <p>{greeting} Follow the guided setup below: write your idea, confirm your style, then create when every step is ready.</p>
                </div>

                <div className="topbar-actions" aria-label="Quick navigation">
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

            <section className="workflow-card glass-immersive" aria-label="Creation workflow">
                {workflowSteps.map((step, index) => (
                    <div
                        className={`workflow-step ${index < activeWorkflowIndex ? 'done' : ''} ${index === activeWorkflowIndex ? 'active' : ''}`}
                        key={step.label}
                        aria-current={index === activeWorkflowIndex ? 'step' : undefined}
                    >
                        <div className="step-number">{index + 1}</div>
                        <div>
                            <strong>{step.label}</strong>
                            <span>{step.help}</span>
                        </div>
                    </div>
                ))}
            </section>

            <section className="quick-route-card glass-immersive" aria-label="Common creator shortcuts">
                <a href="#image-prompt" className="quick-route active">
                    <IconMagic size={16} />
                    <span>Write prompt</span>
                </a>
                <Link to="/" className="quick-route">
                    <IconLayers size={16} />
                    <span>Choose style</span>
                </Link>
                <Link to="/profile" className="quick-route">
                    <IconImage size={16} />
                    <span>Open history</span>
                </Link>
                <div className={`quick-route status ${canGenerate ? 'ready' : ''}`}>
                    <IconSparkles size={16} />
                    <span>{readinessLabel}</span>
                </div>
            </section>

            <section className="next-action-card glass-immersive" aria-labelledby="next-action-heading">
                <div className="next-action-copy">
                    <span className={`next-action-badge ${nextStep.kind}`}>{nextStep.label}</span>
                    <h2 id="next-action-heading">{nextStep.title}</h2>
                    <p>{nextStep.helper}</p>
                </div>
                <div className="next-action-controls">
                    {nextStep.kind === 'route' && nextStep.to && <Link to={nextStep.to}>{nextStep.label}</Link>}
                    {nextStep.kind === 'anchor' && nextStep.to && <a href={nextStep.to}>{nextStep.label}</a>}
                    {nextStep.kind === 'submit' && <button type="button" onClick={() => handleGenerate()}>{nextStep.label}</button>}
                    {nextStep.kind === 'blocked' && <button type="button" disabled>{nextStep.label}</button>}
                    {nextStep.kind === 'wait' && <button type="button" disabled>{nextStep.label}</button>}
                </div>
            </section>

            <section className="goal-panel glass-immersive" aria-labelledby="goal-heading">
                <div className="goal-heading">
                    <span className="section-kicker"><IconSparkles size={14} /> Choose a starting point</span>
                    <h2 id="goal-heading">What do you want to make?</h2>
                    <p>Pick a familiar goal to start with a useful prompt structure, then edit the details in your own words.</p>
                </div>
                <div className="goal-grid">
                    {creationGoals.map(goal => (
                        <button type="button" key={goal.id} onClick={() => applyGoalPrompt(goal.prompt)}>
                            <strong>{goal.label}</strong>
                            <span>{goal.helper}</span>
                        </button>
                    ))}
                </div>
            </section>

            <main className="generator-layout">
                <section className="control-panel glass-immersive" aria-labelledby="prompt-heading">
                    <div className="panel-heading">
                        <div className="section-kicker"><IconSparkles size={14} /> Start here</div>
                        <h2 id="prompt-heading">Describe your image</h2>
                        <p>Use normal language. Add the subject, style, colors, and mood for better results.</p>
                        <button
                            type="button"
                            className="guide-toggle"
                            onClick={() => setShowPromptGuide(value => !value)}
                            aria-expanded={showPromptGuide}
                        >
                            {showPromptGuide ? 'Hide writing help' : 'Show writing help'}
                        </button>
                    </div>

                    <form onSubmit={handleGenerate} className="prompt-form">
                        <label htmlFor="image-prompt">Image description</label>
                        <textarea
                            id="image-prompt"
                            placeholder="Example: A warm watercolor illustration of a tiny bee building a cozy studio inside a flower."
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
                        <div className="prompt-meta">
                            <span id="prompt-help">Press Enter to generate, Shift + Enter for a new line.</span>
                            <span id="prompt-count">{promptCharacterCount}/1000</span>
                        </div>

                        <div className="prompt-strength" id="prompt-strength" aria-label={`Prompt guide: ${promptScore} of ${promptChecklist.length} suggestions included`}>
                            <div>
                                <strong>Prompt guide</strong>
                                <span>{promptScore}/{promptChecklist.length} helpful details included</span>
                            </div>
                            <div className="strength-track"><i style={{ width: `${(promptScore / promptChecklist.length) * 100}%` }} /></div>
                        </div>

                        {showPromptGuide && (
                            <div className="prompt-coach" aria-label="Prompt quality checklist">
                                {promptChecklist.map(item => {
                                    const isReady = item.match(prompt);
                                    return (
                                        <div className={isReady ? 'ready' : ''} key={item.label}>
                                            <span>{isReady ? '✓' : '•'}</span>
                                            <strong>{item.label}</strong>
                                            <small>{item.help}</small>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="idea-picker" aria-label="Prompt examples">
                            <div className="idea-tabs" role="tablist" aria-label="Prompt example categories">
                                {promptIdeaGroups.map(group => (
                                    <button
                                        type="button"
                                        key={group.id}
                                        role="tab"
                                        aria-selected={activeIdeaGroup === group.id}
                                        className={activeIdeaGroup === group.id ? 'active' : ''}
                                        onClick={() => setActiveIdeaGroup(group.id)}
                                    >
                                        <strong>{group.label}</strong>
                                        <span>{group.helper}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="idea-row">
                                {activePromptIdeaGroup.ideas.map(idea => (
                                    <button type="button" key={idea} onClick={() => setPrompt(idea)}>
                                        {idea}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="readiness-card" aria-label="Generation readiness checklist">
                            <div className="readiness-header">
                                <strong>{readinessLabel}</strong>
                                <span>{readyCount}/{readyChecklist.length}</span>
                            </div>
                            <div className="readiness-list">
                                {readyChecklist.map(item => (
                                    <div className={item.ready ? 'ready' : 'needs-action'} key={item.label}>
                                        <span>{item.ready ? '✓' : '!'}</span>
                                        <strong>{item.label}</strong>
                                        {!item.ready && item.action.startsWith('/') && (
                                            <Link to={item.action}>{item.actionLabel}</Link>
                                        )}
                                        {!item.ready && item.action.startsWith('#') && (
                                            <a href={item.action}>{item.actionLabel}</a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="style-card" aria-label="Selected style or model">
                            <div className="style-icon"><IconMagic size={18} fill="currentColor" /></div>
                            <div>
                                <span>Selected style</span>
                                <strong>{selectedModel?.name || 'Choose a style'}</strong>
                                <p>{selectedModel?.description || `${availableModels.length || 'More'} styles are available. Pick one before generating for more predictable results.`}</p>
                            </div>
                            <Link to="/" className="change-style">Change</Link>
                        </div>

                        <button type="submit" className="generate-button" disabled={!canGenerate} aria-busy={generating}>
                            {generating ? <IconLoader size={18} /> : <IconZap size={18} fill="currentColor" />}
                            <span>{generateLabel}</span>
                        </button>

                        <div className="sticky-create-summary" aria-label="Create action summary">
                            <div>
                                <strong>{nextStep.title}</strong>
                                <span>{readinessLabel}</span>
                            </div>
                            <button type="submit" disabled={!canGenerate}>{canGenerate ? 'Create' : readyCount + '/4 ready'}</button>
                        </div>

                        <div className="safe-helper">
                            <IconHome size={15} />
                            <span>{isOffline ? 'You are offline. Reconnect before creating a new image.' : 'Your recent creations stay organized in your local history.'}</span>
                        </div>
                    </form>
                </section>

                <section className="preview-column" aria-label="Image preview and recent creations">
                    <div className="preview-card glass-immersive">
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

                    <aside className="tips-card glass-immersive" aria-labelledby="tips-heading">
                        <div className="section-kicker"><IconSparkles size={14} /> Prompt guide</div>
                        <h2 id="tips-heading">A good prompt usually includes</h2>
                        <ul>
                            {promptTips.map(tip => <li key={tip}>{tip}</li>)}
                        </ul>
                        <div className="next-step-box">
                            <strong>Not sure where to start?</strong>
                            <p>Pick a Quick start example, swap in your subject, and press Create image.</p>
                        </div>
                    </aside>
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
                                className="recent-card glass-immersive"
                            >
                                <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt={item.prompt || 'Recent generated image'} />
                                <p>{item.prompt}</p>
                            </motion.article>
                        ))}
                    </div>
                ) : (
                    <div className="recent-empty glass-immersive">
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

                .generator-topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 18px; }
                .breadcrumbs { display: flex; align-items: center; gap: 8px; color: var(--color-zinc-500); font-size: 0.78rem; font-weight: 800; margin-bottom: 12px; }
                .breadcrumbs a, .recent-heading-row a { color: var(--color-zinc-400); text-decoration: none; }
                .breadcrumbs a:hover, .recent-heading-row a:hover { color: white; }
                .generator-topbar h1 { font-size: clamp(2rem, 5vw, 4.3rem); letter-spacing: -0.07em; margin-bottom: 10px; }
                .generator-topbar p { max-width: 690px; color: var(--color-zinc-400); font-weight: 600; }
                .topbar-actions { display: flex; gap: 10px; flex-shrink: 0; }
                .secondary-action { min-height: 42px; padding: 0 14px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.09); border-radius: 14px; color: white; text-decoration: none; background: rgba(255,255,255,0.035); font-size: 0.82rem; font-weight: 900; }
                .secondary-action:hover { border-color: rgba(139, 92, 246, 0.5); background: rgba(139, 92, 246, 0.12); }

                .workflow-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 12px; border-radius: 24px; margin-bottom: 12px; }
                .workflow-step { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 18px; color: var(--color-zinc-500); background: rgba(255,255,255,0.02); border: 1px solid transparent; }
                .workflow-step.active { color: white; background: rgba(139, 92, 246, 0.14); border-color: rgba(139, 92, 246, 0.25); }
                .workflow-step.done { color: white; background: rgba(34, 197, 94, 0.08); border-color: rgba(34, 197, 94, 0.18); }
                .step-number { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 999px; background: rgba(255,255,255,0.08); font-size: 0.78rem; font-weight: 950; }
                .workflow-step.done .step-number { background: rgba(34, 197, 94, 0.22); }
                .workflow-step strong, .workflow-step span { display: block; }
                .workflow-step strong { font-size: 0.82rem; }
                .workflow-step span { font-size: 0.68rem; color: var(--color-zinc-400); font-weight: 700; margin-top: 1px; }

                .quick-route-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 10px; border-radius: 22px; margin-bottom: 18px; }
                .quick-route { min-height: 46px; border-radius: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--color-zinc-400); text-decoration: none; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); font-size: 0.8rem; font-weight: 900; }
                .quick-route.active, .quick-route.ready { color: white; border-color: rgba(139, 92, 246, 0.35); background: rgba(139, 92, 246, 0.12); }
                .quick-route.status { pointer-events: none; }
                .quick-route:hover { color: white; border-color: rgba(139, 92, 246, 0.45); }

                .next-action-card { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 18px; padding: 18px; border-radius: 26px; margin-bottom: 14px; }
                .next-action-copy h2, .goal-heading h2 { font-size: 1.35rem; margin: 7px 0; letter-spacing: -0.04em; }
                .next-action-copy p, .goal-heading p { color: var(--color-zinc-400); font-size: 0.86rem; font-weight: 650; }
                .next-action-badge { display: inline-flex; width: fit-content; border-radius: 999px; padding: 6px 9px; color: white; background: rgba(139, 92, 246, 0.16); border: 1px solid rgba(139, 92, 246, 0.28); font-size: 0.68rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; }
                .next-action-badge.blocked { color: #fca5a5; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.22); }
                .next-action-badge.submit { background: rgba(34, 197, 94, 0.12); border-color: rgba(34, 197, 94, 0.24); }
                .next-action-controls a, .next-action-controls button { min-height: 46px; min-width: 132px; padding: 0 16px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 16px; color: white; text-decoration: none; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); font-weight: 950; cursor: pointer; }
                .next-action-controls button:disabled { cursor: not-allowed; color: var(--color-zinc-500); background: rgba(255,255,255,0.05); }

                .goal-panel { display: grid; grid-template-columns: 0.75fr 1.25fr; gap: 18px; align-items: center; padding: 18px; border-radius: 26px; margin-bottom: 18px; }
                .goal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
                .goal-grid button { min-height: 98px; text-align: left; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 12px; color: var(--color-zinc-400); background: rgba(255,255,255,0.025); cursor: pointer; }
                .goal-grid button:hover { color: white; border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.1); transform: translateY(-2px); }
                .goal-grid strong, .goal-grid span { display: block; }
                .goal-grid strong { color: white; font-size: 0.83rem; margin-bottom: 6px; }
                .goal-grid span { font-size: 0.72rem; line-height: 1.35; font-weight: 700; }

                .generator-layout { display: grid; grid-template-columns: minmax(330px, 0.9fr) minmax(360px, 1.1fr); gap: 20px; align-items: start; }
                .control-panel, .preview-card, .tips-card, .recent-empty { border-radius: 30px; }
                .control-panel { padding: 22px; position: sticky; top: 18px; }
                .panel-heading { margin-bottom: 18px; }
                .section-kicker { display: inline-flex; align-items: center; gap: 7px; color: var(--color-accent); font-size: 0.72rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.12em; }
                .panel-heading h2, .tips-card h2, .recent-heading-row h2 { font-size: 1.55rem; margin: 8px 0 8px; letter-spacing: -0.04em; }
                .panel-heading p, .tips-card li, .safe-helper, .prompt-meta, .next-step-box p { color: var(--color-zinc-400); font-size: 0.86rem; font-weight: 650; }
                .guide-toggle { margin-top: 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; background: rgba(255,255,255,0.035); color: white; padding: 8px 12px; font-size: 0.76rem; font-weight: 900; cursor: pointer; }

                .prompt-form { display: flex; flex-direction: column; gap: 14px; }
                .prompt-form label { font-size: 0.78rem; font-weight: 950; color: white; }
                .prompt-form textarea { width: 100%; min-height: 168px; resize: vertical; border: 1px solid rgba(255,255,255,0.09); border-radius: 22px; background: rgba(255,255,255,0.035); color: white; padding: 16px; font-size: 1rem; line-height: 1.5; outline: none; }
                .prompt-form textarea:focus { border-color: rgba(139, 92, 246, 0.8); box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.14); }
                .prompt-meta { display: flex; justify-content: space-between; gap: 12px; margin-top: -6px; }
                .prompt-strength { display: grid; gap: 8px; padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); }
                .prompt-strength > div:first-child { display: flex; justify-content: space-between; gap: 12px; color: white; font-size: 0.78rem; font-weight: 900; }
                .prompt-strength span { color: var(--color-zinc-400); }
                .strength-track { height: 8px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; }
                .strength-track i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--color-accent), var(--color-soft-gold)); transition: width 0.25s ease; }
                .prompt-coach { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
                .prompt-coach div { display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; padding: 10px; border-radius: 15px; color: var(--color-zinc-400); background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); }
                .prompt-coach div.ready { color: white; border-color: rgba(34, 197, 94, 0.24); background: rgba(34, 197, 94, 0.08); }
                .prompt-coach span { grid-row: span 2; font-weight: 950; color: var(--color-accent); }
                .prompt-coach strong { font-size: 0.76rem; }
                .prompt-coach small { font-size: 0.68rem; font-weight: 700; }
                .idea-picker { display: grid; gap: 10px; }
                .idea-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
                .idea-tabs button { text-align: left; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); color: var(--color-zinc-400); padding: 10px; border-radius: 15px; cursor: pointer; }
                .idea-tabs button.active { color: white; border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.12); }
                .idea-tabs strong, .idea-tabs span { display: block; }
                .idea-tabs strong { font-size: 0.72rem; }
                .idea-tabs span { font-size: 0.64rem; font-weight: 700; margin-top: 2px; }
                .idea-row { display: flex; flex-wrap: wrap; gap: 8px; }
                .idea-row button { border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.035); color: var(--color-zinc-400); padding: 8px 10px; border-radius: 14px; font-size: 0.76rem; font-weight: 850; cursor: pointer; text-align: left; }
                .idea-row button:hover { color: white; border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.1); }

                .readiness-card { display: grid; gap: 10px; border-radius: 20px; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
                .readiness-header { display: flex; justify-content: space-between; gap: 12px; color: white; font-weight: 950; }
                .readiness-header span { color: var(--color-zinc-400); }
                .readiness-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
                .readiness-list div { min-height: 38px; display: flex; align-items: center; gap: 7px; border-radius: 13px; padding: 8px; background: rgba(255,255,255,0.025); color: var(--color-zinc-400); font-size: 0.72rem; font-weight: 900; }
                .readiness-list div.ready { color: white; background: rgba(34, 197, 94, 0.08); }
                .readiness-list span { width: 18px; height: 18px; display: grid; place-items: center; border-radius: 999px; color: white; background: rgba(239, 68, 68, 0.7); font-size: 0.66rem; }
                .readiness-list .ready span { background: rgba(34, 197, 94, 0.75); }
                .readiness-list a { margin-left: auto; color: white; text-decoration: none; border-radius: 999px; padding: 5px 7px; background: rgba(139, 92, 246, 0.2); }

                .style-card { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; padding: 14px; border-radius: 22px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); }
                .style-icon { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); }
                .style-card span { display: block; color: var(--color-zinc-500); font-size: 0.68rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; }
                .style-card strong { display: block; color: white; font-size: 0.95rem; margin: 1px 0 3px; }
                .style-card p { font-size: 0.75rem; line-height: 1.35; max-height: 2.7em; overflow: hidden; }
                .change-style { color: white; text-decoration: none; border-radius: 13px; padding: 8px 10px; font-size: 0.76rem; font-weight: 950; background: rgba(255,255,255,0.07); }
                .change-style:hover { background: rgba(139, 92, 246, 0.24); }

                .generate-button { min-height: 56px; border: none; border-radius: 18px; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); color: white; display: inline-flex; align-items: center; justify-content: center; gap: 10px; font-weight: 950; font-size: 0.98rem; cursor: pointer; box-shadow: 0 18px 36px rgba(139, 92, 246, 0.26); }
                .generate-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 24px 46px rgba(139, 92, 246, 0.36); }
                .generate-button:disabled { cursor: not-allowed; color: var(--color-zinc-500); background: rgba(255,255,255,0.05); box-shadow: none; }
                .sticky-create-summary { position: sticky; bottom: 116px; z-index: 5; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; padding: 12px; border-radius: 18px; background: rgba(24,24,27,0.82); border: 1px solid rgba(255,255,255,0.09); backdrop-filter: blur(22px); box-shadow: 0 18px 38px rgba(0,0,0,0.28); }
                .sticky-create-summary strong, .sticky-create-summary span { display: block; }
                .sticky-create-summary strong { color: white; font-size: 0.82rem; }
                .sticky-create-summary span { color: var(--color-zinc-400); font-size: 0.72rem; font-weight: 800; margin-top: 2px; }
                .sticky-create-summary button { min-height: 38px; border: 0; border-radius: 13px; padding: 0 13px; color: white; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); font-weight: 950; cursor: pointer; }
                .sticky-create-summary button:disabled { cursor: not-allowed; color: var(--color-zinc-500); background: rgba(255,255,255,0.06); }
                .safe-helper { display: flex; align-items: center; gap: 8px; padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.025); }

                .preview-column { display: flex; flex-direction: column; gap: 16px; }
                .preview-card { padding: 16px; }
                .preview-header { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 4px 4px 14px; }
                .preview-header span { display: block; color: var(--color-zinc-500); font-size: 0.72rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.12em; }
                .preview-header strong { color: white; font-size: 1rem; }
                .preview-badges { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; }
                .model-pill { max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; padding: 8px 11px; color: var(--color-zinc-400); font-size: 0.76rem; font-weight: 850; }
                .readiness-pill.ready { color: white; border-color: rgba(34, 197, 94, 0.35); background: rgba(34, 197, 94, 0.1); }
                .preview-stage { min-height: 520px; aspect-ratio: 1 / 1; border-radius: 24px; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative; background: radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.16), rgba(255,255,255,0.025) 48%, rgba(0,0,0,0.18)); border: 1px solid rgba(255,255,255,0.07); }
                .generation-state, .empty-preview { text-align: center; max-width: 380px; padding: 28px; }
                .generation-state h3, .empty-preview h3 { font-size: 1.35rem; margin: 14px 0 8px; }
                .progress-orbit, .empty-preview > div { width: 84px; height: 84px; margin: 0 auto; border-radius: 28px; display: grid; place-items: center; color: var(--color-accent); background: rgba(139, 92, 246, 0.12); }
                .progress-orbit { animation: breathe 2.2s ease-in-out infinite; }
                .generation-steps, .empty-actions-inline { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
                .generation-steps span, .empty-actions-inline a { border-radius: 999px; padding: 7px 9px; color: white; text-decoration: none; font-size: 0.72rem; font-weight: 900; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08); }
                .result-figure { width: 100%; height: 100%; position: relative; }
                .result-figure img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .result-figure figcaption { position: absolute; left: 14px; right: 14px; bottom: 14px; padding: 12px 14px; border-radius: 16px; background: rgba(0,0,0,0.58); backdrop-filter: blur(18px); color: white; font-size: 0.82rem; font-weight: 700; line-height: 1.35; }
                .result-figure figcaption span { display: block; color: var(--color-zinc-300); font-size: 0.66rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }

                .tips-card { padding: 18px; }
                .tips-card h2 { font-size: 1.15rem; }
                .tips-card ul { list-style: none; display: grid; gap: 8px; margin-top: 12px; }
                .tips-card li { position: relative; padding-left: 20px; }
                .tips-card li::before { content: ''; position: absolute; left: 0; top: 0.7em; width: 7px; height: 7px; border-radius: 999px; background: var(--color-accent); box-shadow: 0 0 12px rgba(139, 92, 246, 0.8); }
                .next-step-box { margin-top: 14px; padding: 14px; border-radius: 18px; background: rgba(139, 92, 246, 0.09); border: 1px solid rgba(139, 92, 246, 0.18); }
                .next-step-box strong { color: white; }
                .next-step-box p { margin-top: 5px; }

                .recent-section { margin-top: 24px; }
                .recent-heading-row { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
                .recent-heading-row h2 { margin-bottom: 0; }
                .recent-heading-row a { font-size: 0.84rem; font-weight: 950; }
                .recent-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
                .recent-card { border-radius: 20px; overflow: hidden; min-height: 184px; }
                .recent-card img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; }
                .recent-card p { padding: 10px; color: var(--color-zinc-400); font-size: 0.75rem; line-height: 1.25; font-weight: 700; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .recent-empty { display: flex; align-items: center; gap: 10px; padding: 16px; color: var(--color-zinc-400); font-weight: 750; }

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
                    .workflow-card, .quick-route-card, .goal-grid, .prompt-coach, .idea-tabs, .readiness-list { grid-template-columns: 1fr; }
                    .workflow-step:not(.active) { display: none; }
                    .next-action-controls a, .next-action-controls button { width: 100%; }
                    .style-card { grid-template-columns: auto 1fr; }
                    .change-style { grid-column: 1 / -1; text-align: center; }
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