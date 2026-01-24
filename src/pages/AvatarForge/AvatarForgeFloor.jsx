import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Layers, Search, TrendingUp, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AvatarForgeFloor() {
    const [mintedItems, setMintedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);

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

    const filteredItems = mintedItems.filter(item =>
        item.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userDisplayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className="forge-immersive-container floor-mode">

            {/* Floating Control Bar */}
            <motion.div
                className="floor-control-bar"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="floor-stats">
                    <span className="stat-highlight">{mintedItems.length}</span>
                    <span className="stat-label">Minted Assets</span>
                </div>

                <div className={`floor-search-floating ${showSearch ? 'open' : ''}`}>
                    <Search size={18} className="search-icon-float" onClick={() => setShowSearch(!showSearch)} />
                    <input
                        type="text"
                        className="search-input-float"
                        placeholder="Filter collection..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onBlur={() => !searchTerm && setShowSearch(false)}
                    />
                </div>
            </motion.div>

            {/* Gallery Grid */}
            <div className="floor-scroll-area">
                {loading ? (
                    <div className="floor-grid-immersive">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="immersive-card-skeleton animate-pulse" />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="empty-state-immersive">
                        <Layers size={48} className="text-zinc-700 mb-4" />
                        <h3>Gallery Empty</h3>
                        <p>No artifacts found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="floor-grid-immersive">
                        {filteredItems.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                className="immersive-card"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                            >
                                <div className="immersive-visual">
                                    <img src={item.thumbnailUrl || item.url} alt="" loading="lazy" />
                                    <div className="immersive-overlay">
                                        <div className="card-info">
                                            <span className="card-theme">{item.theme}</span>
                                            <div className="card-meta">
                                                <span className="owner-tag">@{item.userDisplayName || 'Unknown'}</span>
                                                <span className={`rarity-dot ${item.rarity?.toLowerCase()}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
