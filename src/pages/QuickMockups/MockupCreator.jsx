import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Upload, Loader2, Sparkles, Image as ImageIcon, Download, ChevronLeft } from 'lucide-react';
import SEO from '../../components/SEO';
import './QuickMockups.css';
import '../MockupCatalog/MockupProductPage.css'; // Reuse some layout styles but we'll override as needed

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

const MockupCreator = () => {
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
                    toast.error("Mockup not found");
                    navigate('/quick-mockups');
                }
            } catch (err) {
                console.error("Error fetching item:", err);
                toast.error("Failed to load mockup");
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
                setGeneratedResult(null);
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
            <div className="qm-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    if (!itemData) return null;

    return (
        <div className="qm-creator-container animate-in">
            <SEO
                title={`${itemData.label} Maker`}
                description={`Create premium ${itemData.label} mockups instantly.`}
            />

            <Link to="/quick-mockups" className="qm-back-link">
                <ChevronLeft size={20} /> Back to Mockup Maker
            </Link>

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
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{itemData.label}</h1>
                        <p>{itemData.formatSpec || `Create a professional ${itemData.label} mockup.`}</p>
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
                        <div className="mpp-presets-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
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
                                    <Sparkles size={20} /> Generate {itemData.label}
                                </>
                            )}
                        </button>
                        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
                            Cost: 0.25 Zaps
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockupCreator;
