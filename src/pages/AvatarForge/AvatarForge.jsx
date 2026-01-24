import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserInteractions } from '../../contexts/UserInteractionsContext';
import { useApi } from '../../hooks/useApi';
import { db } from '../../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import {
    Sparkles,
    Upload,
    X,
    Zap,
    CheckCircle2,
    Info,
    TrendingUp,
    Layers,
    Users,
    ChevronRight,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import './AvatarForge.css';

export default function AvatarForge() {
    const { currentUser } = useAuth();
    const { userProfile } = useUserInteractions();
    const { call: apiCall } = useApi();

    const [theme, setTheme] = useState('');
    const [style, setStyle] = useState('');
    const [referenceImage, setReferenceImage] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch collections
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'avatar_collections'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCollections(docs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setReferenceImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!theme && !style) {
            return toast.error("Please enter a theme or style!");
        }

        setGenerating(true);
        const toastId = toast.loading("Forging your collection...");

        try {
            await apiCall('api', {
                action: 'generateAvatarCollection',
                theme,
                style,
                referenceImage
            });

            toast.success("Collection forged! Claim your favorites below.", { id: toastId });
            setTheme('');
            setStyle('');
            setReferenceImage(null);
        } catch (error) {
            console.error("Generation failed:", error);
            toast.error(error.message || "Failed to forge collection", { id: toastId });
        } finally {
            setGenerating(false);
        }
    };

    const handleMint = async (collectionId, index) => {
        const toastId = toast.loading("Minting and claiming...");
        try {
            await apiCall('api', {
                action: 'mintAvatar',
                collectionId,
                imageIndex: index
            });
            toast.success("Avatar minted! Welcome to the collection.", { id: toastId });
        } catch (error) {
            console.error("Minting failed:", error);
            toast.error(error.message || "Failed to mint", { id: toastId });
        }
    };

    // Derived: Latest unminted collection for the "Minting Drop" section
    const latestDrop = collections.find(c => c.images.some(img => !img.minted));

    // Derived: All minted items for the "Floor"
    const floorItems = collections.flatMap(c =>
        c.images.filter(img => img.minted).map(img => ({
            ...img,
            collectionName: c.name,
            userDisplayName: c.userDisplayName,
            collectionId: c.id
        }))
    ).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    return (
        <div className="avatar-forge-page container">
            <SEO
                title="Avatar Forge - NFT Style PFP Collections"
                description="Create curated PFP collections with Gemini AI. NFT floor style gallery without the blockchain."
            />

            {/* Hero Section */}
            <section className="forge-hero">
                <div className="hero-background">
                    <div className="hero-glow"></div>
                </div>
                <div className="hero-content">
                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        Avatar Forge
                    </motion.h1>
                    <motion.p
                        className="hero-subtitle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        Create high-end curated PFP collections using Gemini 2.5 Flash.
                        No blockchain, just pure creative ownership.
                    </motion.p>

                    <div className="forge-stats">
                        <div className="stat-item">
                            <span className="stat-value">{(collections.length * 4.2).toFixed(1)}K</span>
                            <span className="stat-label">Volume</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">0.45 ETH</span>
                            <span className="stat-label">Floor</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{floorItems.length}</span>
                            <span className="stat-label">Minted Items</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Generator Panel */}
            <section className="generator-section">
                <div className="generator-card">
                    <div className="input-grid">
                        <div className="input-group">
                            <label className="input-label">
                                <TrendingUp size={16} /> Collection Theme
                            </label>
                            <input
                                type="text"
                                className="forge-input"
                                placeholder="e.g. Cyberpunk Ninjas, Pastel Kitties..."
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <Sparkles size={16} /> Artistic Style
                            </label>
                            <input
                                type="text"
                                className="forge-input"
                                placeholder="e.g. Neon Noir, Watercolor, 3D Render..."
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">
                            <Layers size={16} /> Reference Image (Optional)
                        </label>
                        {referenceImage ? (
                            <div className="preview-container">
                                <img src={referenceImage} alt="Reference" className="preview-image" />
                                <button className="remove-preview" onClick={() => setReferenceImage(null)}>
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <label className="image-upload-area">
                                <Upload size={32} className="text-slate-500 mb-2" />
                                <p className="text-sm text-slate-400">Drag or click to upload</p>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        )}
                    </div>

                    <button
                        className="generate-button"
                        onClick={handleGenerate}
                        disabled={generating}
                    >
                        {generating ? (
                            <Sparkles className="spinning-loader" />
                        ) : (
                            <Zap size={20} fill="currentColor" />
                        )}
                        <span>{generating ? 'Forging Collection...' : 'Forge New Lot (5 Zaps)'}</span>
                    </button>

                    <p className="text-xs text-center mt-4 text-slate-500">
                        <Info size={12} className="inline mr-1" />
                        Forging creates a lot of 4 images. You only pay to "Claim" (Mint) the ones you want.
                    </p>
                </div>
            </section>

            {/* Latest Drop (Minting View) */}
            <AnimatePresence>
                {latestDrop && (
                    <motion.section
                        className="minting-section"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">Latest Drop: {latestDrop.name}</h2>
                                <p className="text-zinc-500 text-sm mt-1">A curated lot of 4 unique PFPs.</p>
                            </div>
                            <button
                                className="btn-claim-all"
                                onClick={() => handleMintCollection(latestDrop.id)}
                            >
                                <Zap size={18} fill="currentColor" />
                                Claim All (5 Zaps)
                            </button>
                        </div>
                        <div className="mint-grid">
                            {latestDrop.images.map((img, idx) => (
                                <div key={idx} className="mint-card">
                                    <div className="mint-visual">
                                        <img src={img.thumbnailUrl || img.url} alt="" className="mint-img" />
                                    </div>
                                    <div className="mint-details-mini">
                                        <span className="text-xs text-zinc-400">#{idx + 1}</span>
                                        <p className="text-xs text-zinc-500 truncate">{img.definition?.accessories?.primary}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Floor Gallery */}
            <section className="collections-section">
                <div className="section-header">
                    <h2 className="section-title">The Floor</h2>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <TrendingUp size={14} /> Claimed: {floorItems.length}
                    </div>
                </div>

                {loading ? (
                    <div className="floor-grid">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="floor-card animate-pulse" style={{ height: '300px' }}></div>
                        ))}
                    </div>
                ) : floorItems.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
                        <Layers size={48} className="mx-auto mb-4 text-zinc-700" />
                        <h3 className="text-xl font-bold mb-2">No items on the floor</h3>
                        <p className="text-zinc-500">Claim (Mint) your first avatar to see it here!</p>
                    </div>
                ) : (
                    <div className="floor-grid">
                        {floorItems.map((item, idx) => (
                            <motion.div
                                key={idx}
                                className="floor-card"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <div className="floor-visual">
                                    <img src={item.thumbnailUrl || item.url} alt="" className="floor-img" />
                                    <div className="floor-overlay">
                                        <div className="item-details">
                                            <span className="item-coll">{item.collectionName}</span>
                                            <span className="item-user">@{item.userDisplayName}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
