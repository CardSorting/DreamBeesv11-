import React, { useEffect, useState, useMemo } from 'react';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { ArrowLeft, Sparkles, X, Palette, LayoutGrid, Tag } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils';
import Sidebar from '../components/Sidebar';
import FeedPost from '../components/FeedPost';
import './Discovery.css';

export default function Discovery() {
    const navigate = useNavigate();
    const { getGlobalShowcaseImages, availableModels, rateShowcaseImage } = useModel();

    // 1. Fetch All Data
    const [allImages, setAllImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const imgs = await getGlobalShowcaseImages();
            setAllImages(imgs || []);
            setLoading(false);
        };
        load();
    }, [getGlobalShowcaseImages]);

    // 2. Aggregate Metadata (Memoized)
    const { vibeCounts, collections, palettes } = useMemo(() => {
        const vCounts = {};
        const cMap = {}; // name -> { count, image }
        const pMap = {}; // name -> { count, colors }

        allImages.forEach(img => {
            // Vibes
            if (img.discovery?.vibeTags) {
                img.discovery.vibeTags.forEach(tag => {
                    vCounts[tag] = (vCounts[tag] || 0) + 1;
                });
            }

            // Collections
            if (img.discovery?.suggestedCollections) {
                img.discovery.suggestedCollections.forEach(col => {
                    if (!cMap[col]) {
                        cMap[col] = { count: 0, image: img, name: col };
                    }
                    cMap[col].count++;
                });
            }

            // Palettes
            if (img.colors?.paletteName) {
                const pName = img.colors.paletteName;
                if (!pMap[pName]) {
                    pMap[pName] = { count: 0, colors: img.colors.dominant || [], name: pName };
                }
                pMap[pName].count++;
            }
        });

        return {
            vibeCounts: Object.entries(vCounts)
                .sort((a, b) => b[1] - a[1]) // Sort by count
                .slice(0, 20) // Top 20
                .map(([tag, count]) => ({ tag, count })),

            collections: Object.values(cMap)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),

            palettes: Object.values(pMap)
                .sort((a, b) => b.count - a.count)
                .slice(0, 12)
        };
    }, [allImages]);

    // 3. Filter State
    // filter: { type: 'vibe' | 'collection' | 'palette', value: string } | null
    const [filter, setFilter] = useState(null);
    const [activeShowcaseImage, setActiveShowcaseImage] = useState(null);

    // 4. Derived Filtered Images
    const filteredImages = useMemo(() => {
        if (!filter) return [];
        return allImages.filter(img => {
            if (filter.type === 'vibe') return img.discovery?.vibeTags?.includes(filter.value);
            if (filter.type === 'collection') return img.discovery?.suggestedCollections?.includes(filter.value);
            if (filter.type === 'palette') return img.colors?.paletteName === filter.value;
            return false;
        });
    }, [allImages, filter]);

    return (
        <div className="feed-layout-wrapper">
            <SEO title="Discovery Engine - DreamBees" description="Explore AI Art by Vibe, Collection, and Color." />

            <Sidebar activeId="/discovery" />

            <main className="feed-main-content">
                <header className="mobile-feed-header">
                    <div className="header-title">
                        <span>DISCOVERY</span>
                        <Sparkles size={16} className="text-purple-500 fill-purple-500" />
                    </div>
                </header>

                <div className="discovery-container">

                    {/* --- MAIN DASHBOARD (No Filter) --- */}
                    {!filter && (
                        <div className="discovery-dashboard animate-enter">
                            <h1 className="page-title">Find Your Inspiration</h1>
                            <p className="page-subtitle">Explore the hive mind through curated vibes and collections.</p>

                            {/* VIBES CLOUD */}
                            <section className="disc-section">
                                <h3 className="section-header"><Tag size={18} /> Trending Vibes</h3>
                                <div className="vibe-cloud">
                                    {vibeCounts.map(({ tag, count }) => (
                                        <button
                                            key={tag}
                                            onClick={() => setFilter({ type: 'vibe', value: tag })}
                                            className="vibe-pill"
                                        >
                                            {tag} <span className="count">{count}</span>
                                        </button>
                                    ))}
                                    {vibeCounts.length === 0 && !loading && <p className="empty-text">Not enough data yet.</p>}
                                </div>
                            </section>

                            {/* COLLECTIONS */}
                            <section className="disc-section">
                                <h3 className="section-header"><LayoutGrid size={18} /> Curated Collections</h3>
                                <div className="collection-grid">
                                    {collections.map((col) => (
                                        <div
                                            key={col.name}
                                            className="collection-card"
                                            onClick={() => setFilter({ type: 'collection', value: col.name })}
                                        >
                                            <img src={getOptimizedImageUrl(col.image.thumbnailUrl || col.image.url)} alt={col.name} className="col-bg" />
                                            <div className="col-overlay">
                                                <h4>{col.name}</h4>
                                                <span>{col.count} images</span>
                                            </div>
                                        </div>
                                    ))}
                                    {collections.length === 0 && !loading && <p className="empty-text">Generating collections...</p>}
                                </div>
                            </section>

                            {/* PALETTES */}
                            <section className="disc-section">
                                <h3 className="section-header"><Palette size={18} /> Browse by Palette</h3>
                                <div className="palette-grid">
                                    {palettes.map((pal) => (
                                        <button
                                            key={pal.name}
                                            onClick={() => setFilter({ type: 'palette', value: pal.name })}
                                            className="palette-card"
                                        >
                                            <div className="palette-swatch">
                                                {pal.colors.map((c, i) => (
                                                    <div key={i} style={{ background: c }} />
                                                ))}
                                            </div>
                                            <span className="palette-name">{pal.name}</span>
                                        </button>
                                    ))}
                                    {palettes.length === 0 && !loading && <p className="empty-text">Extracting palettes...</p>}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* --- FILTERED RESULTS --- */}
                    {filter && (
                        <div className="results-view animate-enter">
                            <div className="results-header">
                                <button onClick={() => setFilter(null)} className="back-btn-text">
                                    <ArrowLeft size={16} /> Back to Discovery
                                </button>
                                <div className="active-filter-display">
                                    <span className="filter-type">{filter.type}</span>
                                    <h2>{filter.value}</h2>
                                    <button onClick={() => setFilter(null)} className="clear-filter"><X size={16} /></button>
                                </div>
                            </div>

                            <div className="feed-posts-container masonry-grid">
                                {filteredImages.map((imgItem, index) => (
                                    <FeedPost
                                        key={imgItem.id || index}
                                        imgItem={imgItem}
                                        index={index}
                                        model={availableModels.find(m => m.id === imgItem.modelId) || { name: 'Unknown', image: '/icon.png' }}
                                        getOptimizedImageUrl={getOptimizedImageUrl}
                                        rateShowcaseImage={rateShowcaseImage}
                                        navigate={navigate}
                                        setActiveShowcaseImage={setActiveShowcaseImage}
                                        variant="masonry"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {activeShowcaseImage && (
                <ShowcaseModal
                    image={activeShowcaseImage}
                    model={availableModels.find(m => m.id === activeShowcaseImage.modelId) || null}
                    onClose={() => setActiveShowcaseImage(null)}
                />
            )}


        </div>
    );
}
