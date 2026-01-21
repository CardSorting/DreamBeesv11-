import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'; // Updated imports
import { db } from '../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Upload, Loader2, Sparkles, Image as ImageIcon, Download } from 'lucide-react';
import './MockupProductPage.css';

// Re-declare MOCKUP_PRESETS since it was wiped out in previous step error
const MOCKUP_PRESETS = [
    { id: 'studio', label: 'Clean Studio' },
    { id: 'marble', label: 'Luxury Marble' },
    { id: 'shadow_play', label: 'Dynamic Shadows' },
    { id: 'otaku_room', label: 'The Shrine' },
    { id: 'school_desk', label: 'Classroom' },
    { id: 'akiba_night', label: 'Akiba Night' },
    { id: 'wood', label: 'Wood Table' },
    { id: 'cafe', label: 'Cafe Vibe' },
    { id: 'plants', label: 'Botanical' },
    { id: 'beach', label: 'Beach Scene' },
    { id: 'industrial', label: 'Industrial' },
    { id: 'street', label: 'Urban Street' },
    { id: 'retro', label: 'Retro Polaroid' }
];

// Sub-component for verifying generations
const MockupGallerySection = ({ itemId }) => {
    const [galleryItems, setGalleryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                // Query: generations where mockupItemId == itemId
                // Note: This requires a composite index if we sort by createdAt
                // For now, let's try without sort if index is missing, or catch error
                let q = query(
                    collection(db, 'generations'),
                    where('mockupItemId', '==', itemId),
                    where('type', '==', 'mockup'),
                    where('isPublic', '==', true),
                    orderBy('createdAt', 'desc'),
                    limit(12)
                );

                try {
                    const snapshot = await getDocs(q);
                    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setGalleryItems(items);
                } catch (indexError) {
                    console.warn("Index missing, falling back to unsorted query", indexError);
                    // Fallback to client-side sort if index is missing
                    q = query(
                        collection(db, 'generations'),
                        where('mockupItemId', '==', itemId),
                        where('type', '==', 'mockup'),
                        where('isPublic', '==', true),
                        limit(20)
                    );
                    const snapshot = await getDocs(q);
                    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Client side sort could go here but order isn't critical for fallback
                    setGalleryItems(items);
                }

            } catch (err) {
                console.error("Error fetching gallery:", err);
            } finally {
                setLoading(false);
            }
        };

        if (itemId) fetchGallery();
    }, [itemId]);

    if (loading) return null;
    if (galleryItems.length === 0) return null;

    return (
        <div className="mpp-gallery-section animate-in" style={{ marginTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff' }}>Created with this Mockup</h2>
            <div className="mpp-gallery-grid">
                {galleryItems.map(item => (
                    <div key={item.id} className="mpp-gallery-card">
                        <div className="mpp-gallery-image-wrapper">
                            <img
                                src={item.url}
                                alt={item.prompt || "Mockup"}
                                className="mpp-gallery-image"
                                loading="lazy"
                            />
                            <div className="mpp-gallery-overlay">
                                {/* Potentially add actions here like 'View' or 'Like' in future */}
                            </div>
                        </div>
                        <div className="mpp-gallery-info">
                            <div className="mpp-gallery-user">
                                {item.userPhotoURL ? (
                                    <img src={item.userPhotoURL} alt={item.userDisplayName} className="mpp-user-avatar" />
                                ) : (
                                    <div className="mpp-user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {item.userDisplayName?.[0] || 'U'}
                                    </div>
                                )}
                                <span className="truncate">{item.userDisplayName || 'Anonymous'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MockupProductPage = () => {
    // ... (rest of component code)
    const { itemId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const functions = getFunctions();

    const [itemData, setItemData] = useState(null);
    const [loadingItem, setLoadingItem] = useState(true);

    // Generator State
    const [uploadedImage, setUploadedImage] = useState(null); // base64
    const [selectedPreset, setSelectedPreset] = useState('studio');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState(null);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const docRef = doc(db, 'mockup_items', itemId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setItemData({ id: docSnap.id, ...docSnap.data() });
                } else {
                    toast.error("Item not found");
                    navigate('/mockup-catalog');
                }
            } catch (err) {
                console.error("Error fetching item:", err);
                toast.error("Failed to load item");
            } finally {
                setLoadingItem(false);
            }
        };
        if (itemId) fetchItem();
    }, [itemId, navigate]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result);
                setGeneratedResult(null); // Clear previous result
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!currentUser) {
            toast.error("Please login to generate mockups");
            return;
        }
        if (!uploadedImage) {
            toast.error("Please upload a design first");
            return;
        }

        setIsGenerating(true);
        const generateFn = httpsCallable(functions, 'generateMockupItem');

        try {
            const result = await generateFn({
                image: uploadedImage,
                itemId: itemId,
                presetId: selectedPreset
            });

            if (result.data.success) {
                setGeneratedResult(result.data);
                toast.success("Mockup generated!");
            } else {
                throw new Error(result.data.error || "Unknown error");
            }

        } catch (error) {
            console.error("Generation failed:", error);
            toast.error(error.message || "Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (loadingItem) {
        return (
            <div className="mpp-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    if (!itemData) return null;

    return (
        <div className="mpp-container animate-in">
            <SEO
                title={`${itemData.label} Mockup`}
                description={`Generate high-quality ${itemData.label} mockups. ${itemData.formatSpec || ''}`}
                image={itemData.thumbnailUrl || itemData.url}
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "Product",
                            "name": `${itemData.label} AI Mockup Template`,
                            "description": `Professional AI-powered mockup for ${itemData.label}.`,
                            "image": itemData.thumbnailUrl || itemData.url,
                            "offers": {
                                "@type": "Offer",
                                "price": "0.25",
                                "priceCurrency": "ZAP",
                                "availability": "https://schema.org/InStock"
                            }
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Catalog", "item": "https://dreambeesai.com/mockup-catalog" },
                                { "@type": "ListItem", "position": 3, "name": itemData.label, "item": `https://dreambeesai.com/mockup-catalog/item/${itemId}` }
                            ]
                        }
                    ]
                }}
            />
            <button className="mpp-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} /> Back to Catalog
            </button>

            <div className="mpp-content">
                {/* Left Column: Visuals */}
                <div className="mpp-visual-col">
                    <div className="mpp-preview-stage">
                        {generatedResult ? (
                            <img
                                src={generatedResult.url}
                                alt="Generated Mockup"
                                className="mpp-preview-image animate-in"
                            />
                        ) : uploadedImage ? (
                            <div className="mpp-preview-placeholder">
                                <img
                                    src={uploadedImage}
                                    alt="Your Design"
                                    style={{ maxWidth: '50%', maxHeight: '50%', opacity: 0.5 }}
                                />
                                <p>Ready to Generate</p>
                            </div>
                        ) : (
                            <div className="mpp-preview-placeholder">
                                <ImageIcon size={64} style={{ opacity: 0.2 }} />
                                <p>Preview Area</p>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="mpp-result-overlay">
                                <div className="loading-pulse">Generating Magic...</div>
                            </div>
                        )}
                    </div>

                    {generatedResult && (
                        <div style={{ textAlign: 'center' }}>
                            <a
                                href={generatedResult.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mc-hero-cta"
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Download size={18} /> Download High-Res
                            </a>
                        </div>
                    )}
                </div>

                {/* Right Column: Controls */}
                <div className="mpp-controls-col">
                    <div className="mpp-header">
                        <h1>{itemData.label}</h1>
                        <p>{itemData.formatSpec || `Generate a premium mockup for ${itemData.label}`}</p>
                    </div>

                    {/* Step 1: Upload */}
                    <div className="mpp-section">
                        <h3>1. Upload your Design</h3>
                        <label className="mpp-upload-area">
                            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                            {uploadedImage ? (
                                <img src={uploadedImage} alt="Preview" className="mpp-upload-preview" />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                    <Upload size={32} />
                                    <span>Click to browse</span>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Step 2: Preset */}
                    <div className="mpp-section">
                        <h3>2. Select Environment</h3>
                        <div className="mpp-presets-grid">
                            {MOCKUP_PRESETS.map(preset => (
                                <div
                                    key={preset.id}
                                    className={`mpp-preset-card ${selectedPreset === preset.id ? 'active' : ''}`}
                                    onClick={() => setSelectedPreset(preset.id)}
                                >
                                    <div className="mpp-preset-label">{preset.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 3: Generate */}
                    <div className="mpp-actions">
                        <button
                            className="mpp-generate-btn"
                            onClick={handleGenerate}
                            disabled={isGenerating || !uploadedImage}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="mpp-loading-spinner" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} /> Generate Mockup
                                </>
                            )}
                        </button>
                        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
                            Cost: 0.25 Zaps per generation
                        </p>
                    </div>
                </div>
            </div>

            {/* Gallery Section */}
            <MockupGallerySection itemId={itemId} />
        </div>
    );
};

export default MockupProductPage;
