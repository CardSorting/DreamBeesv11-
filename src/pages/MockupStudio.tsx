/**
 * [LAYER: PAGE]
 * Industrialized Mockup Studio for DreamBees Lite.
 * Integrates both Gacha (Surprise) and Catalog (Deterministic) workflows.
 * Matches industry standards for professional creative tools.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLite } from '../contexts/LiteContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { 
    IconLayers, IconDownload, IconSparkles, IconChevronLeft, 
    IconImage, IconLoader, IconZap, IconSearch, IconCheck, IconMagic 
} from '../icons';
import { useNavigate } from 'react-router-dom';
import { MOCKUP_ITEMS, MOCKUP_PRESETS } from '../data/mockupData';
import toast from 'react-hot-toast';

const STUDIO_MODES = [
    { id: 'standard', label: 'Standard', icon: '🍯', description: 'Surprise hive products' },
    { id: 'tcg', label: 'TCG Card', icon: '🃏', description: 'Authentic trading cards' },
    { id: 'doll', label: 'Doll Reskin', icon: '🧸', description: 'Custom vinyl reskins' }
];

const CATEGORIES = ['All', 'Apparel', 'Tech', 'Home & Living', 'Print', 'Reskin'];

export default function MockupStudio() {
    const navigate = useNavigate();
    const { history, localHistory, currentUser } = useLite();
    
    // Global Navigation State
    const [activeTab, setActiveTab] = useState<'gacha' | 'catalog'>('gacha');
    
    // Shared Input State
    const [selectedArt, setSelectedArt] = useState<any>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Gacha State
    const [selectedMode, setSelectedMode] = useState(STUDIO_MODES[0]);
    const [prizes, setPrizes] = useState<any[]>([]);
    
    // Catalog State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(MOCKUP_ITEMS[0]);
    const [selectedPreset, setSelectedPreset] = useState(MOCKUP_PRESETS[0]);
    const [catalogResult, setCatalogResult] = useState<string | null>(null);

    // Derived Data
    const allArt = useMemo(() => {
        const combined = [...history, ...localHistory];
        const unique = Array.from(new Map(combined.map(item => [item.id || item.imageUrl, item])).values());
        return unique.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }, [history, localHistory]);

    const filteredItems = useMemo(() => {
        return MOCKUP_ITEMS.filter(item => {
            const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    // Handlers
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setSelectedArt(null);
                setCatalogResult(null);
                setPrizes([]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleArtSelect = (art: any) => {
        setSelectedArt(art);
        setUploadedImage(null);
        setCatalogResult(null);
        setPrizes([]);
    };

    const toBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleGachaSpin = async () => {
        if (!currentUser) { toast.error("Please sign in first."); return; }
        let base64Image = uploadedImage;
        if (!base64Image && selectedArt) {
            try {
                toast.loading("Preparing nectar...", { id: 'prep' });
                base64Image = await toBase64(selectedArt.imageUrl);
                toast.dismiss('prep');
            } catch (err) { toast.error("Art asset failed."); return; }
        }
        if (!base64Image) { toast.error("Deposit a design first."); return; }

        setIsGenerating(true);
        const gachaFn = httpsCallable(functions, 'gachaSpin');
        try {
            const result = await gachaFn({ image: base64Image, mode: selectedMode.id });
            const data = result.data as any;
            if (data?.success && data?.prizes) {
                setPrizes(data.prizes);
                toast.success("Hives harvested!");
            } else throw new Error(data?.error || "Machine jammed.");
        } catch (err: any) { toast.error(err.message || "Spin failed."); }
        finally { setIsGenerating(false); }
    };

    const handleCatalogGenerate = async () => {
        if (!currentUser) { toast.error("Please sign in first."); return; }
        let base64Image = uploadedImage;
        if (!base64Image && selectedArt) {
            try {
                toast.loading("Preparing nectar...", { id: 'prep' });
                base64Image = await toBase64(selectedArt.imageUrl);
                toast.dismiss('prep');
            } catch (err) { toast.error("Art asset failed."); return; }
        }
        if (!base64Image) { toast.error("Deposit a design first."); return; }

        setIsGenerating(true);
        const generateFn = httpsCallable(functions, 'generateMockupItem');
        try {
            const result = await generateFn({
                image: base64Image,
                itemId: selectedCatalogItem.id,
                presetId: selectedPreset.id
            });
            const data = result.data as any;
            if (data?.url) {
                setCatalogResult(data.url);
                toast.success("Mockup manifested!");
            } else throw new Error("No URL returned.");
        } catch (err: any) { toast.error(err.message || "Manifesting failed."); }
        finally { setIsGenerating(false); }
    };

    return (
        <div className="mockup-studio-v2">
            <header className="studio-topbar glass-immersive">
                <div className="topbar-left">
                    <button className="back-btn" onClick={() => navigate(-1)}><IconChevronLeft size={20} /></button>
                    <div className="tab-switcher">
                        <button 
                            className={`tab-btn ${activeTab === 'gacha' ? 'active' : ''}`}
                            onClick={() => setActiveTab('gacha')}
                        >
                            <IconMagic size={16} /> <span>Bee Crate</span>
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
                            onClick={() => setActiveTab('catalog')}
                        >
                            <IconLayers size={16} /> <span>Catalog</span>
                        </button>
                    </div>
                </div>
                <div className="topbar-right">
                    <IconLayers size={22} className="header-glow-icon" />
                </div>
            </header>

            <main className="studio-main">
                {/* PREVIEW STAGE (Top/Left) */}
                <section className="viewport-container">
                    <div className="mockup-stage glass-immersive">
                        <AnimatePresence mode="wait">
                            {isGenerating ? (
                                <motion.div 
                                    key="loading"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="stage-overlay"
                                >
                                    <div className="loader-box">
                                        <IconLoader size={48} className="spin" />
                                        <span>Manifesting Design...</span>
                                    </div>
                                </motion.div>
                            ) : null}

                            {activeTab === 'gacha' ? (
                                prizes.length > 0 ? (
                                    <motion.div key="prizes" className="prizes-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        {prizes.map((p, i) => (
                                            <div key={i} className="prize-item">
                                                <img src={p.url} alt={p.label} />
                                                <div className="prize-label">
                                                    <span>{p.label}</span>
                                                    <a href={p.url} download target="_blank" rel="noreferrer"><IconDownload size={14} /></a>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div key="empty-gacha" className="empty-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div className="machine-visual">
                                            <IconZap size={64} className="zap-glow" />
                                            <h3>Bee Crate Gachapon</h3>
                                            <p>Deposit design nectar to harvest 3 surprise hives.</p>
                                        </div>
                                    </motion.div>
                                )
                            ) : (
                                catalogResult ? (
                                    <motion.div key="result" className="result-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <img src={catalogResult} alt="Mockup Result" />
                                        <div className="result-actions">
                                            <button className="action-btn-p" onClick={() => window.open(catalogResult, '_blank')}>
                                                <IconDownload size={18} /> High Res
                                            </button>
                                            <button className="action-btn-s" onClick={() => setCatalogResult(null)}>Reset</button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="empty-catalog" className="empty-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div className="catalog-selection-preview">
                                            <div className="blueprint-visual">
                                                <IconLayers size={48} />
                                                <h4>{selectedCatalogItem?.label}</h4>
                                                <span className="preset-label">Environment: {selectedPreset.label}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>
                    </div>

                    {/* INPUT SECTION (Design Deposit) */}
                    <div className="input-panel glass-immersive">
                        <div className="panel-header">
                            <IconSparkles size={16} /> <span>1. Deposit Design</span>
                        </div>
                        <div className="deposit-controls">
                            <label className="upload-btn">
                                <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                                <IconDownload size={18} style={{ transform: 'rotate(180deg)' }} />
                                <span>Upload</span>
                            </label>
                            <div className="art-scroller">
                                {allArt.map(art => (
                                    <button 
                                        key={art.id || art.imageUrl}
                                        className={`art-dot ${selectedArt?.id === art.id ? 'active' : ''}`}
                                        onClick={() => handleArtSelect(art)}
                                    >
                                        <img src={art.imageUrl} alt="art" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button 
                            className={`execute-btn ${(!uploadedImage && !selectedArt) || isGenerating ? 'disabled' : ''}`}
                            onClick={activeTab === 'gacha' ? handleGachaSpin : handleCatalogGenerate}
                            disabled={(!uploadedImage && !selectedArt) || isGenerating}
                        >
                            <IconZap size={20} fill="currentColor" />
                            <span>{activeTab === 'gacha' ? 'Harvest Hives' : 'Manifest Mockup'}</span>
                        </button>
                    </div>
                </section>

                {/* SIDEBAR/CONTROLS (Right) */}
                <aside className="controls-sidebar">
                    {activeTab === 'gacha' ? (
                        <div className="gacha-controls animate-fade-in">
                            <div className="sidebar-group">
                                <label>Studio Mode</label>
                                <div className="mode-grid">
                                    {STUDIO_MODES.map(m => (
                                        <button 
                                            key={m.id}
                                            className={`mode-btn ${selectedMode.id === m.id ? 'active' : ''}`}
                                            onClick={() => setSelectedMode(m)}
                                        >
                                            <span className="mode-ico">{m.icon}</span>
                                            <div className="mode-info">
                                                <strong>{m.label}</strong>
                                                <small>{m.description}</small>
                                            </div>
                                            {selectedMode.id === m.id && <IconCheck size={14} className="check-ico" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="catalog-controls animate-fade-in">
                            <div className="sidebar-group">
                                <label>Product Catalog</label>
                                <div className="search-box">
                                    <IconSearch size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Search items..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="category-tags">
                                    {CATEGORIES.map(c => (
                                        <button 
                                            key={c}
                                            className={`cat-tag ${activeCategory === c ? 'active' : ''}`}
                                            onClick={() => setActiveCategory(c)}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                                <div className="item-catalog-grid">
                                    {filteredItems.map(item => (
                                        <button 
                                            key={item.id}
                                            className={`item-card ${selectedCatalogItem?.id === item.id ? 'active' : ''}`}
                                            onClick={() => setSelectedCatalogItem(item)}
                                        >
                                            <strong>{item.label}</strong>
                                            <small>{item.category}</small>
                                            {selectedCatalogItem?.id === item.id && <div className="selection-dot" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="sidebar-group">
                                <label>Environment</label>
                                <div className="preset-grid">
                                    {MOCKUP_PRESETS.map(p => (
                                        <button 
                                            key={p.id}
                                            className={`preset-btn ${selectedPreset.id === p.id ? 'active' : ''}`}
                                            onClick={() => setSelectedPreset(p)}
                                        >
                                            <strong>{p.label}</strong>
                                            <small>{p.description}</small>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </aside>
            </main>

            <style>{`
                .mockup-studio-v2 { min-height: 100vh; background: #080808; color: white; display: flex; flex-direction: column; }
                
                .studio-topbar { height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 100; position: sticky; top: 0; }
                .topbar-left { display: flex; align-items: center; gap: 20px; }
                .tab-switcher { display: flex; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                .tab-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; border: none; background: transparent; color: var(--color-zinc-400); font-size: 0.75rem; font-weight: 900; cursor: pointer; transition: all 0.2s; }
                .tab-btn.active { background: rgba(255,255,255,0.1); color: white; }
                
                .header-glow-icon { color: var(--color-accent); filter: drop-shadow(0 0 8px var(--color-accent)); opacity: 0.8; }

                .studio-main { flex: 1; display: grid; grid-template-columns: 1fr 340px; gap: 24px; padding: 24px; max-width: 1600px; margin: 0 auto; width: 100%; }

                /* VIEWPORT SECTION */
                .viewport-container { display: flex; flex-direction: column; gap: 20px; }
                .mockup-stage { flex: 1; min-height: 500px; border-radius: 32px; background: #000; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; }
                
                .stage-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 50; }
                .loader-box { text-align: center; color: var(--color-accent); }
                .loader-box span { display: block; margin-top: 15px; font-size: 0.8rem; font-weight: 950; letter-spacing: 2px; text-transform: uppercase; }

                .empty-stage { text-align: center; opacity: 0.3; }
                .zap-glow { margin-bottom: 20px; filter: drop-shadow(0 0 20px var(--color-accent)); color: var(--color-accent); }
                
                .prizes-stage { width: 100%; height: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 12px; }
                .prize-item { position: relative; border-radius: 16px; overflow: hidden; background: #111; }
                .prize-item img { width: 100%; height: 100%; object-fit: cover; }
                .prize-label { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; justify-content: space-between; align-items: center; }
                .prize-label span { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; }
                
                .result-stage { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
                .result-stage img { max-width: 100%; max-height: 80%; border-radius: 12px; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
                .result-actions { display: flex; gap: 12px; margin-top: 20px; }
                
                .blueprint-visual { text-align: center; border: 1px dashed rgba(255,255,255,0.2); padding: 40px; border-radius: 24px; color: var(--color-zinc-500); }
                .preset-label { display: block; margin-top: 10px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }

                /* INPUT PANEL */
                .input-panel { border-radius: 24px; padding: 16px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 20px; }
                .panel-header { display: flex; align-items: center; gap: 8px; color: var(--color-accent); font-size: 0.7rem; font-weight: 950; text-transform: uppercase; white-space: nowrap; }
                .deposit-controls { display: flex; align-items: center; gap: 16px; border-left: 1px solid rgba(255,255,255,0.08); padding-left: 20px; }
                .upload-btn { width: 44px; height: 44px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
                .upload-btn span { font-size: 0.5rem; font-weight: 900; text-transform: uppercase; margin-top: 2px; }
                
                .art-scroller { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
                .art-scroller::-webkit-scrollbar { display: none; }
                .art-dot { width: 44px; height: 44px; border-radius: 10px; overflow: hidden; border: 2px solid transparent; flex-shrink: 0; padding: 0; background: #111; cursor: pointer; transition: all 0.2s; }
                .art-dot.active { border-color: var(--color-accent); transform: translateY(-4px); }
                .art-dot img { width: 100%; height: 100%; object-fit: cover; }
                
                .execute-btn { height: 50px; padding: 0 24px; border-radius: 12px; background: var(--color-accent); border: none; color: white; font-weight: 950; display: flex; align-items: center; gap: 10px; cursor: pointer; text-transform: uppercase; font-size: 0.8rem; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2); transition: all 0.3s; }
                .execute-btn.disabled { opacity: 0.4; filter: grayscale(1); cursor: not-allowed; box-shadow: none; }

                /* SIDEBAR */
                .controls-sidebar { display: flex; flex-direction: column; gap: 24px; }
                .sidebar-group label { display: block; font-size: 0.7rem; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; color: var(--color-zinc-500); margin-bottom: 12px; }
                
                .mode-grid { display: grid; gap: 8px; }
                .mode-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 14px; display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer; position: relative; }
                .mode-btn.active { border-color: var(--color-accent); background: rgba(139, 92, 246, 0.08); }
                .mode-ico { font-size: 1.2rem; }
                .mode-info strong { display: block; font-size: 0.85rem; color: white; }
                .mode-info small { font-size: 0.65rem; color: var(--color-zinc-500); }
                .check-ico { position: absolute; right: 12px; top: 12px; color: var(--color-accent); }

                .search-box { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 0 12px; border-radius: 10px; margin-bottom: 12px; }
                .search-box input { flex: 1; height: 38px; background: transparent; border: none; color: white; font-size: 0.8rem; outline: none; }
                
                .category-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
                .cat-tag { padding: 5px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; background: rgba(255,255,255,0.05); color: var(--color-zinc-400); border: none; cursor: pointer; }
                .cat-tag.active { background: white; color: black; }

                .item-catalog-grid { display: grid; gap: 6px; max-height: 300px; overflow-y: auto; padding-right: 4px; }
                .item-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: left; cursor: pointer; position: relative; }
                .item-card.active { border-color: var(--color-accent); background: rgba(139, 92, 246, 0.05); }
                .item-card strong { display: block; font-size: 0.75rem; color: white; }
                .item-card small { font-size: 0.6rem; color: var(--color-zinc-500); }
                .selection-dot { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 6px; height: 6px; border-radius: 50%; background: var(--color-accent); box-shadow: 0 0 8px var(--color-accent); }

                .preset-grid { display: grid; gap: 6px; }
                .preset-btn { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 10px; text-align: left; cursor: pointer; }
                .preset-btn.active { border-color: var(--color-accent); background: rgba(139, 92, 246, 0.05); }
                .preset-btn strong { display: block; font-size: 0.7rem; color: white; }
                .preset-btn small { font-size: 0.55rem; color: var(--color-zinc-600); }

                .action-btn-p { padding: 10px 20px; border-radius: 10px; background: var(--color-accent); color: white; font-weight: 900; border: none; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.8rem; }
                .action-btn-s { padding: 10px 20px; border-radius: 10px; background: rgba(255,255,255,0.1); color: white; font-weight: 900; border: none; cursor: pointer; font-size: 0.8rem; }

                @media (max-width: 900px) {
                    .studio-main { grid-template-columns: 1fr; }
                    .input-panel { grid-template-columns: 1fr; }
                    .deposit-controls { border-left: none; padding-left: 0; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.08); }
                    .execute-btn { width: 100%; }
                    .viewport-container { order: 1; }
                    .controls-sidebar { order: 2; }
                }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
