import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconHome, IconImage, IconLayers, IconLoader, IconMagic, IconSparkles, IconUser, IconZap } from '../icons';

const promptIdeas = [
    'A cozy bee studio inside a giant sunflower, soft morning light',
    'A friendly robot painting clouds above a peaceful city',
    'A storybook cottage bakery shaped like a honeycomb',
    'A dreamy product photo of lavender tea on a moonlit table'
];

const promptTips = [
    'Subject: who or what should be in the image',
    'Style: watercolor, cinematic, 3D, anime, photo, or sketch',
    'Details: colors, mood, lighting, background, and composition'
];

const workflowSteps = [
    { label: 'Describe', help: 'Write the idea' },
    { label: 'Choose style', help: 'Pick a model' },
    { label: 'Generate', help: 'Create image' },
    { label: 'Review', help: 'Save or reuse' }
];

export default function Generator() {
    const [prompt, setPrompt] = useState('');
    const { selectedModel, generate, generating, localHistory, currentUser } = useLite();

    const cleanPrompt = prompt.trim();
    const latestImage = localHistory[0];
    const recentImages = localHistory.slice(1, 9);
    const promptCharacterCount = prompt.length;

    const greeting = useMemo(() => {
        const firstName = currentUser?.displayName?.split(' ')[0];
        return firstName ? `Hi ${firstName}, what are we creating today?` : 'What are we creating today?';
    }, [currentUser]);

    const generateLabel = generating ? 'Creating image...' : cleanPrompt ? 'Generate image' : 'Describe your image first';

    const handleGenerate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!cleanPrompt || generating) return;
        await generate(cleanPrompt);
        setPrompt('');
    };

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate();
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [cleanPrompt, generating]);

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
                    <p>{greeting} Describe the result you want, choose a style, then generate.</p>
                </div>

                <div className="topbar-actions" aria-label="Quick navigation">
                    <Link to="/" className="secondary-action">
                        <IconLayers size={16} />
                        Models
                    </Link>
                    <Link to="/profile" className="secondary-action">
                        <IconUser size={16} />
                        History
                    </Link>
                </div>
            </header>

            <section className="workflow-card glass-immersive" aria-label="Creation workflow">
                {workflowSteps.map((step, index) => (
                    <div className={`workflow-step ${index === 0 ? 'active' : ''}`} key={step.label}>
                        <div className="step-number">{index + 1}</div>
                        <div>
                            <strong>{step.label}</strong>
                            <span>{step.help}</span>
                        </div>
                    </div>
                ))}
            </section>

            <main className="generator-layout">
                <section className="control-panel glass-immersive" aria-labelledby="prompt-heading">
                    <div className="panel-heading">
                        <div className="section-kicker"><IconSparkles size={14} /> Start here</div>
                        <h2 id="prompt-heading">Describe your image</h2>
                        <p>Use normal language. Add the subject, style, colors, and mood for better results.</p>
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
                            aria-describedby="prompt-help prompt-count"
                            maxLength={1000}
                        />
                        <div className="prompt-meta">
                            <span id="prompt-help">Press Enter to generate, Shift + Enter for a new line.</span>
                            <span id="prompt-count">{promptCharacterCount}/1000</span>
                        </div>

                        <div className="idea-row" aria-label="Prompt examples">
                            {promptIdeas.map(idea => (
                                <button type="button" key={idea} onClick={() => setPrompt(idea)}>
                                    {idea}
                                </button>
                            ))}
                        </div>

                        <div className="style-card" aria-label="Selected style or model">
                            <div className="style-icon"><IconMagic size={18} fill="currentColor" /></div>
                            <div>
                                <span>Selected style</span>
                                <strong>{selectedModel?.name || 'Choose a style'}</strong>
                                <p>{selectedModel?.description || 'Pick a visual style before generating for more predictable results.'}</p>
                            </div>
                            <Link to="/" className="change-style">Change</Link>
                        </div>

                        <button type="submit" className="generate-button" disabled={generating || !cleanPrompt} aria-busy={generating}>
                            {generating ? <IconLoader size={18} /> : <IconZap size={18} fill="currentColor" />}
                            <span>{generateLabel}</span>
                        </button>

                        <div className="safe-helper">
                            <IconHome size={15} />
                            <span>Your recent creations stay organized in your local history.</span>
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
                            {selectedModel?.name && <div className="model-pill">{selectedModel.name}</div>}
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
                                        <figcaption>{latestImage.prompt}</figcaption>
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
                                        <p>Start with one of the examples or write your own idea in the description box.</p>
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
                .generator-topbar p { max-width: 640px; color: var(--color-zinc-400); font-weight: 600; }
                .topbar-actions { display: flex; gap: 10px; flex-shrink: 0; }
                .secondary-action { min-height: 42px; padding: 0 14px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.09); border-radius: 14px; color: white; text-decoration: none; background: rgba(255,255,255,0.035); font-size: 0.82rem; font-weight: 900; }
                .secondary-action:hover { border-color: rgba(139, 92, 246, 0.5); background: rgba(139, 92, 246, 0.12); }

                .workflow-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 12px; border-radius: 24px; margin-bottom: 18px; }
                .workflow-step { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 18px; color: var(--color-zinc-500); background: rgba(255,255,255,0.02); }
                .workflow-step.active { color: white; background: rgba(139, 92, 246, 0.14); border: 1px solid rgba(139, 92, 246, 0.25); }
                .step-number { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 999px; background: rgba(255,255,255,0.08); font-size: 0.78rem; font-weight: 950; }
                .workflow-step strong, .workflow-step span { display: block; }
                .workflow-step strong { font-size: 0.82rem; }
                .workflow-step span { font-size: 0.68rem; color: var(--color-zinc-400); font-weight: 700; margin-top: 1px; }

                .generator-layout { display: grid; grid-template-columns: minmax(320px, 0.86fr) minmax(360px, 1.14fr); gap: 20px; align-items: start; }
                .control-panel, .preview-card, .tips-card, .recent-empty { border-radius: 30px; }
                .control-panel { padding: 22px; position: sticky; top: 18px; }
                .panel-heading { margin-bottom: 18px; }
                .section-kicker { display: inline-flex; align-items: center; gap: 7px; color: var(--color-accent); font-size: 0.72rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.12em; }
                .panel-heading h2, .tips-card h2, .recent-heading-row h2 { font-size: 1.55rem; margin: 8px 0 8px; letter-spacing: -0.04em; }
                .panel-heading p, .tips-card li, .safe-helper, .prompt-meta { color: var(--color-zinc-400); font-size: 0.86rem; font-weight: 650; }

                .prompt-form { display: flex; flex-direction: column; gap: 14px; }
                .prompt-form label { font-size: 0.78rem; font-weight: 950; color: white; }
                .prompt-form textarea { width: 100%; min-height: 168px; resize: vertical; border: 1px solid rgba(255,255,255,0.09); border-radius: 22px; background: rgba(255,255,255,0.035); color: white; padding: 16px; font-size: 1rem; line-height: 1.5; outline: none; }
                .prompt-form textarea:focus { border-color: rgba(139, 92, 246, 0.8); box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.14); }
                .prompt-meta { display: flex; justify-content: space-between; gap: 12px; margin-top: -6px; }
                .idea-row { display: flex; flex-wrap: wrap; gap: 8px; }
                .idea-row button { border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.035); color: var(--color-zinc-400); padding: 8px 10px; border-radius: 14px; font-size: 0.76rem; font-weight: 850; cursor: pointer; text-align: left; }
                .idea-row button:hover { color: white; border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.1); }

                .style-card { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; padding: 14px; border-radius: 22px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); }
                .style-icon { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); }
                .style-card span { display: block; color: var(--color-zinc-500); font-size: 0.68rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; }
                .style-card strong { display: block; color: white; font-size: 0.95rem; margin: 1px 0 3px; }
                .style-card p { font-size: 0.75rem; line-height: 1.35; max-height: 2.7em; overflow: hidden; }
                .change-style { color: white; text-decoration: none; border-radius: 13px; padding: 8px 10px; font-size: 0.76rem; font-weight: 950; background: rgba(255,255,255,0.07); }
                .change-style:hover { background: rgba(139, 92, 246, 0.24); }

                .generate-button { min-height: 54px; border: none; border-radius: 18px; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); color: white; display: inline-flex; align-items: center; justify-content: center; gap: 10px; font-weight: 950; font-size: 0.98rem; cursor: pointer; box-shadow: 0 18px 36px rgba(139, 92, 246, 0.26); }
                .generate-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 24px 46px rgba(139, 92, 246, 0.36); }
                .generate-button:disabled { cursor: not-allowed; color: var(--color-zinc-500); background: rgba(255,255,255,0.05); box-shadow: none; }
                .safe-helper { display: flex; align-items: center; gap: 8px; padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.025); }

                .preview-column { display: flex; flex-direction: column; gap: 16px; }
                .preview-card { padding: 16px; }
                .preview-header { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 4px 4px 14px; }
                .preview-header span { display: block; color: var(--color-zinc-500); font-size: 0.72rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.12em; }
                .preview-header strong { color: white; font-size: 1rem; }
                .model-pill { max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; padding: 8px 11px; color: var(--color-zinc-400); font-size: 0.76rem; font-weight: 850; }
                .preview-stage { min-height: 520px; aspect-ratio: 1 / 1; border-radius: 24px; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative; background: radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.16), rgba(255,255,255,0.025) 48%, rgba(0,0,0,0.18)); border: 1px solid rgba(255,255,255,0.07); }
                .generation-state, .empty-preview { text-align: center; max-width: 360px; padding: 28px; }
                .generation-state h3, .empty-preview h3 { font-size: 1.35rem; margin: 14px 0 8px; }
                .progress-orbit, .empty-preview > div { width: 84px; height: 84px; margin: 0 auto; border-radius: 28px; display: grid; place-items: center; color: var(--color-accent); background: rgba(139, 92, 246, 0.12); }
                .progress-orbit { animation: breathe 2.2s ease-in-out infinite; }
                .result-figure { width: 100%; height: 100%; position: relative; }
                .result-figure img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .result-figure figcaption { position: absolute; left: 14px; right: 14px; bottom: 14px; padding: 12px 14px; border-radius: 16px; background: rgba(0,0,0,0.58); backdrop-filter: blur(18px); color: white; font-size: 0.82rem; font-weight: 700; line-height: 1.35; }

                .tips-card { padding: 18px; }
                .tips-card h2 { font-size: 1.15rem; }
                .tips-card ul { list-style: none; display: grid; gap: 8px; margin-top: 12px; }
                .tips-card li { position: relative; padding-left: 20px; }
                .tips-card li::before { content: ''; position: absolute; left: 0; top: 0.7em; width: 7px; height: 7px; border-radius: 999px; background: var(--color-accent); box-shadow: 0 0 12px rgba(139, 92, 246, 0.8); }

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
                    .workflow-card { grid-template-columns: repeat(2, 1fr); }
                    .generator-layout { grid-template-columns: 1fr; }
                    .control-panel { position: static; }
                    .preview-stage { min-height: auto; }
                }

                @media (max-width: 620px) {
                    .generator-page { width: min(100% - 24px, 1180px); padding-top: 16px; }
                    .topbar-actions, .recent-heading-row { align-items: stretch; width: 100%; }
                    .topbar-actions { display: grid; grid-template-columns: 1fr 1fr; }
                    .secondary-action { justify-content: center; }
                    .workflow-card { grid-template-columns: 1fr; }
                    .workflow-step:not(.active) { display: none; }
                    .style-card { grid-template-columns: auto 1fr; }
                    .change-style { grid-column: 1 / -1; text-align: center; }
                    .prompt-meta, .recent-heading-row { flex-direction: column; align-items: flex-start; }
                    .recent-grid { grid-template-columns: repeat(2, 1fr); }
                    .preview-header { align-items: flex-start; flex-direction: column; }
                    .model-pill { max-width: 100%; }
                }
            `}</style>
        </div>
    );
}