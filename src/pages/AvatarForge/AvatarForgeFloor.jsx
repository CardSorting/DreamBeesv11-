import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Layers, Search, User } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const TiltCard = ({ item }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

    // Holographic Foil Shift
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
            }}
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="card-visual-container" style={{ transform: "translateZ(20px)" }}>
                <img src={item.url} alt="" loading="lazy" />

                {/* Rarity Effects */}
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

                {/* Fixed Top Badge - Higher Z */}
                <div className="card-top-row" style={{ transform: "translateZ(60px)" }}>
                    <span className={`rarity-tag-glass-v2 ${rarity}`}>
                        {item.rarity || 'Common'}
                    </span>
                    <span className="mint-count-glass-v2">
                        #{item.mintNumber || 'GEN-0'}
                    </span>
                </div>

                {/* Hover Overlay - Different Depth */}
                <div className="card-bottom-overlay-v2" style={{ transform: "translateZ(40px)" }}>
                    <div className="user-info-glass-v2">
                        <User size={12} className="mr-1.5 opacity-80" />
                        <span>{item.userDisplayName || 'Anonymous Creator'}</span>
                    </div>
                    <h3 className="card-theme-title-v2">{item.theme}</h3>
                </div>
            </div>

            {/* Ambient Shadow/Glow */}
            <div className={`card-ambient-glow-v2 ${rarity}`} />
        </motion.div>
    );
};

export default function AvatarForgeFloor() {
    const [mintedItems, setMintedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    // Global Spotlight Motion Values
    const spotX = useMotionValue(50);
    const spotY = useMotionValue(50);
    const spotXSpring = useSpring(spotX, { stiffness: 100, damping: 30 });
    const spotYSpring = useSpring(spotY, { stiffness: 100, damping: 30 });

    const spotlightGradient = useTransform(
        [spotXSpring, spotYSpring],
        ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.9) 100%)`
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

    const handleGlobalPointerMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
        spotX.set(xPercent);
        spotY.set(yPercent);
    };

    const filteredItems = mintedItems.filter(item =>
        item.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userDisplayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section
            className="forge-immersive-container floor-mode museum-v2"
            ref={containerRef}
            onPointerMove={handleGlobalPointerMove}
        >
            {/* Global Spotlight Overlay */}
            <motion.div
                className="museum-spotlight-overlay"
                style={{ background: spotlightGradient }}
            />

            {/* Museum Control Bar */}
            <div className="floor-control-bar museum-style-v2">
                <div className="museum-header-group">
                    <h2 className="museum-title-v2">The Collective Archive</h2>
                    <div className="museum-stat-pill">
                        <div className="stat-indicator pulse" />
                        <span>{mintedItems.length} ARTIFACTS MATERIALIZED</span>
                    </div>
                </div>

                <div className="floor-search-v2">
                    <Search size={20} className="search-icon-v2" />
                    <input
                        type="text"
                        placeholder="Scan archives..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="floor-scroll-area-v2">
                {loading ? (
                    <div className="floor-grid-immersive-v2">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="immersive-card-skeleton-v2 animate-pulse" />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="empty-state-immersive-v2">
                        <Layers size={64} className="empty-icon-v2" />
                        <h3>VOID DETECTED</h3>
                        <p>No matching signals found in the archive.</p>
                        <button className="reset-search-btn" onClick={() => setSearchTerm('')}>Reset Scan</button>
                    </div>
                ) : (
                    <div className="floor-grid-immersive-v2">
                        {filteredItems.map((item) => (
                            <TiltCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>

            {/* Floor Perspective Background */}
            <div className="museum-floor-grid" />
        </section>
    );
}
