import React, { useMemo, useState } from 'react';
import { Link, useNavigate, type NavigateFunction } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl, getModelMetadata, type AIModel } from '../lite-utils';
import { IconImage, IconLayers, IconMagic, IconSparkles, IconUser, IconZap } from '../icons';

type CategoryId = 'all' | 'beginner' | 'realistic' | 'illustration' | 'creative';

interface ModelProfile {
    category: CategoryId;
    categoryLabel: string;
    bestFor: string;
    plainTag: string;
    isRecommended: boolean;
}

const categoryOptions: Array<{ id: CategoryId; label: string }> = [
    { id: 'all', label: 'All Styles' },
    { id: 'beginner', label: 'Beginner Friendly' },
    { id: 'realistic', label: 'Realistic' },
    { id: 'illustration', label: 'Illustration' },
    { id: 'creative', label: 'Creative' }
];

function getModelProfile(model: AIModel): ModelProfile {
    const meta = getModelMetadata(model);
    const text = `${model.name} ${model.description}`.toLowerCase();
    const isRealistic = ['real', 'photo', 'portrait', 'product', 'flux', 'cinematic'].some(word => text.includes(word));
    const isIllustration = ['anime', 'illustr', 'cartoon', 'paint', 'draw', 'sketch', 'manga', 'wai'].some(word => text.includes(word));
    const isCreative = !isRealistic && !isIllustration;

    if (meta.isFlagship || text.includes('beginner') || text.includes('easy')) {
        return {
            category: 'beginner',
            categoryLabel: 'Beginner friendly',
            bestFor: meta.isFlagship ? 'A strong default for detailed prompts and polished results.' : meta.insight,
            plainTag: 'Recommended',
            isRecommended: true
        };
    }

    if (isRealistic) {
        return {
            category: 'realistic',
            categoryLabel: 'Realistic',
            bestFor: 'Photo-like images, portraits, products, lighting, and crisp detail.',
            plainTag: 'Photo style',
            isRecommended: false
        };
    }

    if (isIllustration) {
        return {
            category: 'illustration',
            categoryLabel: 'Illustration',
            bestFor: 'Drawn, anime, painted, character, and storybook-style images.',
            plainTag: 'Art style',
            isRecommended: false
        };
    }

    return {
        category: isCreative ? 'creative' : 'all',
        categoryLabel: 'Creative',
        bestFor: meta.insight || 'Stylized images, unusual concepts, and creative exploration.',
        plainTag: 'Creative',
        isRecommended: false
    };
}

function selectModel(model: AIModel, currentUser: unknown, setSelectedModel: (model: AIModel) => void, navigate: NavigateFunction) {
    localStorage.setItem('lite_selected_model', model.id);
    if (!currentUser) {
        navigate('/auth');
        return;
    }
    setSelectedModel(model);
    navigate('/generate');
}

export default function ModelFeed() {
    const { availableModels, setSelectedModel, selectedModel, currentUser, modelsError } = useLite();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const cleanModels = useMemo(() => {
        return availableModels.filter(model => {
            const name = model.name.toLowerCase();
            return !name.includes('test') && !name.includes('draft') && !model.id.includes('hallucinated');
        });
    }, [availableModels]);

    const recommendedModel = useMemo(() => {
        return selectedModel || cleanModels.find(model => getModelProfile(model).isRecommended) || cleanModels[0] || null;
    }, [cleanModels, selectedModel]);

    const visibleModels = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return cleanModels.filter(model => {
            const profile = getModelProfile(model);
            const matchesCategory = activeCategory === 'all' || profile.category === activeCategory || (activeCategory === 'beginner' && profile.isRecommended);
            const matchesSearch = !query || `${model.name} ${model.description} ${profile.categoryLabel} ${profile.bestFor}`.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, cleanModels, searchQuery]);

    const selectedProfile = selectedModel ? getModelProfile(selectedModel) : null;

    return (
        <div className="model-picker-page fade-in">
            <div className="model-picker-mesh" aria-hidden="true">
                <div className="mesh-orb orb-one" />
                <div className="mesh-orb orb-two" />
                <div className="mesh-orb orb-three" />
            </div>

            <header className="model-picker-topbar" aria-label="Model selection header">
                <div>
                    <nav className="breadcrumbs" aria-label="Breadcrumb">
                        <span>Explore</span>
                        <span>/</span>
                        <span>Styles</span>
                    </nav>
                    <h1>Choose a style</h1>
                    <p>
                        {selectedModel 
                            ? `Active style: ${selectedModel.name}. Choose another style below.` 
                            : 'Select a visual direction for your next creation.'}
                    </p>
                </div>

                <div className="topbar-actions" aria-label="Quick navigation">
                    {selectedModel && (
                        <div className="active-style-pill" aria-label={`Active style: ${selectedModel.name}`}>
                            <IconSparkles size={12} />
                            <span>{selectedModel.name}</span>
                        </div>
                    )}
                    <Link to="/generate" className="secondary-action">
                        <IconZap size={16} />
                        Create
                    </Link>
                    <Link to="/profile" className="secondary-action">
                        <IconUser size={16} />
                        History
                    </Link>
                </div>
            </header>

            <section className="browse-panel" aria-labelledby="browse-heading">
                <div className="browse-heading-row">
                    <label className="search-box" htmlFor="model-search">
                        <IconImage size={16} />
                        <input
                            id="model-search"
                            value={searchQuery}
                            onChange={event => setSearchQuery(event.target.value)}
                            placeholder="Search styles..."
                            type="search"
                        />
                        <span className="styles-count">{visibleModels.length} styles</span>
                    </label>
                </div>

                <div className="category-tabs" role="tablist" aria-label="Filter image styles">
                    {categoryOptions.map(option => (
                        <button
                            type="button"
                            key={option.id}
                            role="tab"
                            aria-selected={activeCategory === option.id}
                            className={activeCategory === option.id ? 'active' : ''}
                            onClick={() => setActiveCategory(option.id)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {availableModels.length === 0 && modelsError ? (
                    <EmptyState
                        title="Styles failed to load"
                        body={`DreamBees couldn’t load styles yet. ${modelsError}`}
                        actionLabel="Try again"
                        onAction={() => window.location.reload()}
                    />
                ) : availableModels.length === 0 ? (
                    <EmptyState
                        title="Preparing styles"
                        body="DreamBees is loading your available styles. They will appear here automatically."
                    />
                ) : visibleModels.length === 0 ? (
                    <EmptyState
                        title="No styles match that search"
                        body="Try a simpler word like photo, anime, product, portrait, or clear the filters."
                        actionLabel="Clear search and filters"
                        onAction={() => {
                            setSearchQuery('');
                            setActiveCategory('all');
                        }}
                    />
                ) : (
                    <div className="models-grid">
                        {visibleModels.map((model, idx) => (
                            <ModelCard
                                key={model.id}
                                model={model}
                                idx={idx}
                                selectedModel={selectedModel}
                                currentUser={currentUser}
                                setSelectedModel={setSelectedModel}
                                navigate={navigate}
                            />
                        ))}
                    </div>
                )}
            </section>

            <style>{`
                .model-picker-page { min-height: 100vh; width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 24px 0 40px; position: relative; }
                .model-picker-mesh { position: fixed; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.34; z-index: -1; }
                .mesh-orb { position: absolute; border-radius: 999px; filter: blur(110px); animation: pickerDrift 24s ease-in-out infinite alternate; }
                .orb-one { width: 560px; height: 560px; top: -190px; right: -120px; background: rgba(139, 92, 246, 0.28); }
                .orb-two { width: 440px; height: 440px; bottom: 0; left: -150px; background: rgba(245, 158, 11, 0.14); animation-delay: -6s; }
                .orb-three { width: 360px; height: 360px; top: 34%; left: 34%; background: rgba(168, 85, 247, 0.12); animation-delay: -12s; }

                .model-picker-topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 18px; }
                .breadcrumbs { display: flex; align-items: center; gap: 8px; color: var(--color-zinc-500); font-size: 0.78rem; font-weight: 800; margin-bottom: 12px; }
                .model-picker-topbar h1 { font-size: clamp(2rem, 5vw, 4.25rem); letter-spacing: -0.07em; margin-bottom: 10px; }
                .model-picker-topbar p { max-width: 650px; color: var(--color-zinc-400); font-weight: 650; }
                .topbar-actions { display: flex; gap: 10px; flex-shrink: 0; }
                .secondary-action { min-height: 42px; padding: 0 14px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.09); border-radius: 14px; color: white; text-decoration: none; background: rgba(255,255,255,0.035); font-size: 0.82rem; font-weight: 900; }
                .secondary-action:hover { border-color: rgba(139, 92, 246, 0.5); background: rgba(139, 92, 246, 0.12); }

                .active-style-pill { display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border-radius: 14px; background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.28); color: white; font-size: 0.8rem; font-weight: 800; min-height: 42px; }
                .active-style-pill svg { color: var(--color-accent); }

                .empty-state p { color: var(--color-zinc-400); font-weight: 650; }
                .empty-state button, .use-style-btn { border: none; min-height: 46px; padding: 0 16px; border-radius: 16px; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); color: white; font-weight: 950; cursor: pointer; box-shadow: 0 18px 36px rgba(139, 92, 246, 0.22); }

                .browse-panel { padding: 0; }
                .browse-heading-row { display: flex; justify-content: flex-start; margin-bottom: 16px; }
                .search-box { min-height: 48px; display: flex; align-items: center; gap: 10px; border-radius: 16px; padding: 0 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); color: var(--color-zinc-400); width: 100%; max-width: 480px; }
                .search-box:focus-within { border-color: rgba(139, 92, 246, 0.72); box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.13); }
                .search-box input { width: 100%; border: 0; outline: 0; background: transparent; color: white; font-size: 0.92rem; font-weight: 700; }
                .styles-count { font-size: 0.72rem; font-weight: 800; color: var(--color-zinc-500); white-space: nowrap; flex-shrink: 0; background: rgba(255,255,255,0.04); padding: 4px 8px; border-radius: 8px; margin-left: 8px; }

                .category-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
                .category-tabs button { text-align: center; min-height: 38px; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0 16px; background: rgba(255,255,255,0.025); color: var(--color-zinc-400); cursor: pointer; font-size: 0.82rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
                .category-tabs button:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: white; }
                .category-tabs button.active { color: white; border-color: rgba(139, 92, 246, 0.55); background: rgba(139, 92, 246, 0.14); }

                .models-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
                .style-card { border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); cursor: pointer; transition: all 0.28s ease; display: flex; flex-direction: column; min-height: 100%; }
                .style-card:hover { transform: translateY(-4px); border-color: rgba(139, 92, 246, 0.45); background: rgba(255,255,255,0.045); box-shadow: 0 20px 42px rgba(0,0,0,0.32); }
                .style-card.selected { border-color: var(--color-accent); box-shadow: 0 0 0 1px var(--color-accent), 0 22px 44px rgba(139, 92, 246, 0.12); }
                .style-visual { position: relative; aspect-ratio: 16 / 10; overflow: hidden; background: #18181b; }
                .style-visual img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.75s ease; }
                .style-card:hover .style-visual img { transform: scale(1.05); }
                .style-badges { position: absolute; top: 12px; left: 12px; right: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
                .badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 9px; border-radius: 999px; background: rgba(0,0,0,0.54); color: white; border: 1px solid rgba(255,255,255,0.13); backdrop-filter: blur(12px); font-size: 0.62rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.08em; }
                .badge.selected-badge { background: var(--color-accent); }
                .badge.recommended-badge { color: var(--color-soft-gold); }
                .style-content { padding: 16px; display: flex; flex-direction: column; gap: 11px; flex: 1; }
                .style-eyebrow { color: var(--color-accent); font-size: 0.68rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.12em; }
                .style-content h3 { font-size: 1.08rem; color: white; letter-spacing: -0.04em; }
                .style-description { color: var(--color-zinc-400); font-size: 0.8rem; line-height: 1.38; font-weight: 650; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .style-best-for { display: flex; gap: 8px; color: var(--color-zinc-400); font-size: 0.76rem; line-height: 1.35; font-weight: 750; padding: 10px; border-radius: 15px; background: rgba(255,255,255,0.03); margin-top: auto; }
                .style-best-for svg { color: var(--color-accent); flex-shrink: 0; margin-top: 2px; }
                .use-style-btn { width: 100%; margin-top: 2px; min-height: 42px; box-shadow: none; }
                .style-card.selected .use-style-btn { background: rgba(255,255,255,0.08); }

                .empty-state { min-height: 260px; display: grid; place-items: center; text-align: center; border: 1px dashed rgba(255,255,255,0.12); border-radius: 24px; padding: 28px; background: rgba(255,255,255,0.02); }
                .empty-state-icon { width: 76px; height: 76px; margin: 0 auto 14px; display: grid; place-items: center; border-radius: 26px; color: var(--color-accent); background: rgba(139, 92, 246, 0.13); }
                .empty-state h3 { font-size: 1.25rem; margin-bottom: 8px; }
                .empty-state button { margin-top: 16px; }

                @keyframes pickerDrift { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(38px, 28px, 0) scale(1.08); } }

                @media (max-width: 980px) {
                    .model-picker-topbar { flex-direction: column; }
                }

                @media (max-width: 620px) {
                    .model-picker-page { width: min(100% - 24px, 1180px); padding-top: 16px; }
                    .topbar-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; }
                    .secondary-action { justify-content: center; }
                    .selection-summary { align-items: stretch; }
                    .summary-actions button { width: 100%; }
                    .models-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}

function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
    return (
        <div className="empty-state">
            <div>
                <div className="empty-state-icon"><IconMagic size={34} /></div>
                <h3>{title}</h3>
                <p>{body}</p>
                {actionLabel && onAction && <button type="button" onClick={onAction}>{actionLabel}</button>}
            </div>
        </div>
    );
}

function ModelCard({
    model,
    idx,
    selectedModel,
    setSelectedModel,
    currentUser,
    navigate
}: {
    model: AIModel;
    idx: number;
    selectedModel: AIModel | null;
    setSelectedModel: (model: AIModel) => void;
    currentUser: unknown;
    navigate: NavigateFunction;
}) {
    const profile = useMemo(() => getModelProfile(model), [model]);
    const isSelected = selectedModel?.id === model.id;
    const handleSelect = () => selectModel(model, currentUser, setSelectedModel, navigate);
    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSelect();
        }
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.28) }}
            className={`style-card glass-immersive ${isSelected ? 'selected' : ''}`}
            onClick={handleSelect}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`Use ${model.name} style`}
        >
            <div className="style-visual">
                <img src={getOptimizedImageUrl(model.image) || ''} alt={`${model.name} preview`} />
                <div className="style-badges">
                    {isSelected ? (
                        <span className="badge selected-badge"><IconMagic size={10} fill="currentColor" /> Selected</span>
                    ) : <span />}
                    {profile.isRecommended && <span className="badge recommended-badge">Recommended</span>}
                </div>
            </div>

            <div className="style-content">
                <div>
                    <span className="style-eyebrow">{profile.plainTag}</span>
                    <h3>{model.name}</h3>
                </div>
                <p className="style-description">{model.description}</p>
                <div className="style-best-for">
                    <IconSparkles size={13} />
                    <span><strong>Best for:</strong> {profile.bestFor}</span>
                </div>
                <button
                    type="button"
                    className="use-style-btn"
                    onClick={(event) => {
                        event.stopPropagation();
                        handleSelect();
                    }}
                >
                    {isSelected ? 'Continue with this style' : 'Use this style'}
                </button>
            </div>
        </motion.article>
    );
}