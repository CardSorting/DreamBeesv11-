import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Layers, Search, User, Filter, SlidersHorizontal } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars

const TiltCard = ({ item, rarityScale = 1 }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

    const holoShiftX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
    const holoShiftY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const rarity = (item.rarity || 'common').toLowerCase();

    return (
        <motion.div
            className={`immersive-card-premium museum-2-0 ${rarity}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                scale: rarityScale
            }}
            initial={{ opacity: 0, scale: 0.8 * rarityScale, y: 50 }}
            whileInView={{ opacity: 1, scale: 1 * rarityScale, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="card-visual-container" style={{ transform: "translateZ(20px)" }}>
                <img src={item.url} alt="" loading="lazy" />

                <div className={`card-glare-effect ${rarity}`} />
                {rarity === 'legendary' && (
                    <motion.div
                        className="card-holo-foil"
                        style={{
                            backgroundPositionX: holoShiftX,
                            backgroundPositionY: holoShiftY
                        }}
                    />
                )}

                <div className="card-top-row" style={{ transform: "translateZ(60px)" }}>
                    <span className={`rarity-tag-glass-v2 ${rarity}`}>
                        {item.rarity || 'Common'}
                    </span>
                    <span className="mint-count-glass-v2">
                        #{item.mintNumber || 'GEN-0'}
                    </span>
                </div>

                <div className="card-bottom-overlay-v2" style={{ transform: "translateZ(40px)" }}>
                    <div className="user-info-glass-v2">
                        <User size={12} className="mr-1.5 opacity-80" />
                        <span>{item.userDisplayName || 'Anonymous Creator'}</span>
                    </div>
                    <h3 className="card-theme-title-v2">{item.theme}</h3>
                </div>
            </div>

            <div className={`card-ambient-glow-v2 ${rarity}`} />
        </motion.div>
    );
};

const SectionHeader = ({ title, subtitle, count }) => (
    <div className="museum-section-header">
        <div className="header-content">
            <h2 className="section-title">{title}</h2>
            <p className="section-subtitle">{subtitle}</p>
        </div>
        <div className="section-count">
            <span className="count-num">{count}</span>
            <span className="count-label">Artifacts</span>
        </div>
        <div className="header-line" />
    </div>
);

const ForgeOverviewCard = () => (
    <motion.div
        className="forge-overview-card"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
    >
        <div className="overview-image-wrap">
            <img src="/app-previews/avatar_forge.png" alt="Avatar Forge Preview" />
            <div className="overview-overlay-glass" />
        </div>
        <div className="overview-content">
            <div className="overview-feature-tag">NEW TECHNOLOGY</div>
            <h2 className="overview-title">The Avatar Forge</h2>
            <p className="overview-desc">
                Materialize high-fidelity PFP collections using advanced latent synthesis.
                Each entity is unique, generated with consistent attributes and varying rarity tiers.
            </p>
            <div className="overview-stats-grid">
                <div className="overview-stat">
                    <Zap size={16} />
                    <span>30 ENTITIES PER FORGE</span>
                </div>
                <div className="overview-stat">
                    <Sparkles size={16} />
                    <span>3 RARITY TIERS</span>
                </div>
                <div className="overview-stat">
                    <Layers size={16} />
                    <span>GLOBAL ARCHIVE</span>
                </div>
            </div>
        </div>
    </motion.div>
);

export default function AvatarForgeFloor() {
    const [mintedItems, setMintedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRarity, setFilterRarity] = useState('all');
    const containerRef = useRef(null);

    const spotX = useMotionValue(50);
    const spotY = useMotionValue(50);
    const spotXSpring = useSpring(spotX, { stiffness: 100, damping: 30 });
    const spotYSpring = useSpring(spotY, { stiffness: 100, damping: 30 });

    const spotlightGradient = useTransform(
        [spotXSpring, spotYSpring],
        ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.92) 100%)`
    );

    useEffect(() => {
        const q = query(
            collection(db, 'community_avatar_pool'),
            where('minted', '==', true),
            orderBy('mintedAt', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMintedItems(docs);
            setLoading(false);
        }, (error) => {
            console.error("Floor fetch failed:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredItems = useMemo(() => {
        return mintedItems.filter(item => {
            const matchesSearch = item.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.userDisplayName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRarity = filterRarity === 'all' || item.rarity?.toLowerCase() === filterRarity;
            return matchesSearch && matchesRarity;
        });
    }, [mintedItems, searchTerm, filterRarity]);

    const sections = useMemo(() => {
        const legendaries = filteredItems.filter(item => item.rarity?.toLowerCase() === 'legendary');
        const rares = filteredItems.filter(item => item.rarity?.toLowerCase() === 'rare');
        const commons = filteredItems.filter(item => item.rarity?.toLowerCase() === 'common');
        return { legendaries, rares, commons };
    }, [filteredItems]);

    const handleGlobalPointerMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
        spotX.set(xPercent);
        spotY.set(yPercent);
    };

    return (
        <section
            className="forge-immersive-container floor-mode museum-v3"
            ref={containerRef}
            onPointerMove={handleGlobalPointerMove}
        >
            <motion.div
                className="museum-spotlight-overlay"
                style={{ background: spotlightGradient }}
            />

            {/* Museum Title & Stats */}
            <div className="museum-hero-v3">
                <motion.h1
                    className="museum-main-title"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    The Collective Archive
                </motion.h1>
                <div className="museum-info-row">
                    <div className="stat-pill-v3">
                        <div className="stat-blob" />
                        <span>ACTIVE NODE: ALCHEMIST_CORE</span>
                    </div>
                    <div className="stat-pill-v3">
                        <span>ENTITIES: {mintedItems.length}</span>
                    </div>
                </div>
            </div>

            {/* Floating Glass Command Bar */}
            <motion.div
                className="museum-command-bar"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="command-inner">
                    <div className="command-search-wrap">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Scan by theme or creator..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="command-divider" />

                    <div className="command-filters">
                        {['all', 'legendary', 'rare', 'common'].map((r) => (
                            <button
                                key={r}
                                className={`filter-btn ${filterRarity === r ? 'active' : ''}`}
                                onClick={() => setFilterRarity(r)}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Gallery Content */}
            <div className="museum-content-v3">
                {loading ? (
                    <div className="floor-grid-skeleton-v3">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="skeleton-card-v3 animate-pulse" />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="empty-gallery-v3">
                        <Layers size={64} />
                        <h2>Archive Void</h2>
                        <p>No materialized entities match your search criteria.</p>
                        <button onClick={() => { setSearchTerm(''); setFilterRarity('all'); }}>Reset Archive Scan</button>
                    </div>
                ) : (
                    <div className="museum-architectural-grid">

                        <ForgeOverviewCard />

                        {/* LEGENDARY SECTION */}
                        {sections.legendaries.length > 0 && (
                            <div className="museum-section legendary-hall">
                                <SectionHeader
                                    title="Legendary Hall"
                                    subtitle="One-of-a-kind artifacts from the deep ether."
                                    count={sections.legendaries.length}
                                />
                                <div className="grid-layout-premium">
                                    {sections.legendaries.map(item => (
                                        <TiltCard key={item.id} item={item} rarityScale={1.1} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* RARE SECTION */}
                        {sections.rares.length > 0 && (
                            <div className="museum-section rare-wing">
                                <SectionHeader
                                    title="Rare Wing"
                                    subtitle="Exceptional personas with unique material variants."
                                    count={sections.rares.length}
                                />
                                <div className="grid-layout-standard">
                                    {sections.rares.map(item => (
                                        <TiltCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* COMMON SECTION */}
                        {sections.commons.length > 0 && (
                            <div className="museum-section common-archive">
                                <SectionHeader
                                    title="Common Archive"
                                    subtitle="The foundational entities of the collective."
                                    count={sections.commons.length}
                                />
                                <div className="grid-layout-dense">
                                    {sections.commons.map(item => (
                                        <TiltCard key={item.id} item={item} rarityScale={0.9} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Global Environment Details */}
            <div className="museum-floor-v3" />
            <div className="museum-ambient-particles" />
        </section>
    );
}
