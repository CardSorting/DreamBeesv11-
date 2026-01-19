import React, { useState, useRef, useMemo, useEffect } from 'react';
import './MockupStudio.css';

import { Button } from './components/Button';
import { Spinner } from './components/Spinner';
import { generateMockup } from './services/geminiService';
import { bulkService } from './services/bulkService';
import { presetFactory } from './services/PresetFactory';
import { mockupCache } from '../../services/mockupCache';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';

// Default items fallback if DB is empty or loading fails
const DEFAULT_ITEMS = [];

const AppState = {
    IDLE: 'IDLE',
    PREVIEW: 'PREVIEW',
    GENERATING: 'GENERATING',
    RESULT: 'RESULT',
    BULK_GENERATING: 'BULK_GENERATING',
    BULK_RESULT: 'BULK_RESULT'
};

const MockupStudio = () => {
    const { currentUser } = useAuth();
    const [appState, setAppState] = useState(AppState.IDLE);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Data Loading State
    const [mockupItems, setMockupItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);

    // Bulk State
    const [bulkProgress, setBulkProgress] = useState(null);
    const [zipBlob, setZipBlob] = useState(null);

    // Retrieve presets from the factory
    const presets = useMemo(() => presetFactory.getPresets(), []);

    // State for config
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedPresetId, setSelectedPresetId] = useState(presets[0]?.id || 'studio');

    // Category States
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeProductCategory, setActiveProductCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [customPrompt, setCustomPrompt] = useState('');
    const [error, setError] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const fileInputRef = useRef(null);
    const categoryScrollRef = useRef(null);

    const presetCategories = ['All', 'Studio', 'Lifestyle', 'Nature', 'Urban', 'Vintage'];

    // Dynamically derive unique categories from mockupItems
    const productCategories = useMemo(() => {
        const cats = new Set(mockupItems.map(item => item.category));
        return ['All', ...([...cats].filter(Boolean).sort())];
    }, [mockupItems]);

    // Fetch Mockup Items - using Cache Service
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const items = await mockupCache.getAll();
                setMockupItems(items);

                if (items.length > 0 && !selectedItemId) {
                    setSelectedItemId(items[0].id);
                }
            } catch (err) {
                console.error("Failed to load mockup items:", err);
                setError("Failed to load available products.");
            } finally {
                setLoadingItems(false);
            }
        };
        fetchItems();
    }, []); // Empty dependency array is safe here due to caching logic

    // Icons for Categories (SVG strings ported)
    const categoryIcons = {
        All: (<svg className="ms-icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>),
        Vehicles: (<svg className="ms-icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14l-2.5-5h-9L5 12z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z" /></svg>),
        Electronics: (<svg className="ms-icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>),
    };

    const getIcon = (cat) => categoryIcons[cat] || categoryIcons['All'];

    const filteredPresets = useMemo(() => {
        if (activeCategory === 'All') return presets;
        return presets.filter(p => p.category === activeCategory);
    }, [presets, activeCategory]);

    const filteredItems = useMemo(() => {
        let items = mockupItems;
        if (activeProductCategory !== 'All') {
            items = items.filter(item => item.category === activeProductCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.label.toLowerCase().includes(q) ||
                (item.subjectNoun && item.subjectNoun.toLowerCase().includes(q)) ||
                item.description.toLowerCase().includes(q)
            );
        }
        return items;
    }, [mockupItems, activeProductCategory, searchQuery]);

    // Derived Paginated Items
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredItems, currentPage]);

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeProductCategory, searchQuery]);

    // Calculate counts for badges
    const categoryCounts = useMemo(() => {
        const counts = { All: mockupItems.length };
        mockupItems.forEach(item => {
            if (item.category) {
                counts[item.category] = (counts[item.category] || 0) + 1;
            }
        });
        return counts;
    }, [mockupItems]);

    const selectedItem = mockupItems.find(i => i.id === selectedItemId) || mockupItems[0];
    const selectedPreset = presets.find(p => p.id === selectedPresetId);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        validateAndSetFile(file);
    };

    const validateAndSetFile = (file) => {
        if (file) {
            if (file.type.startsWith('image/')) {
                setSelectedFile(file);
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                setAppState(AppState.PREVIEW);
                setError(null);
            } else {
                setError('Please upload a valid image file (PNG, JPG, WEBP).');
            }
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        // const file = e.dataTransfer.files?.[0]; // Don't validate on leave
    };
    const handleDragOver = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        validateAndSetFile(file);
    };
    const triggerFileInput = () => fileInputRef.current?.click();

    const handleGenerate = async () => {
        if (!selectedFile) return;
        if (!currentUser) {
            setError('Please sign in to generate mockups.');
            return;
        }

        setAppState(AppState.GENERATING);
        setError(null);

        try {
            const selectedPreset = presetFactory.getPresetById(selectedPresetId);
            let scenePromptTemplate = selectedPreset ? selectedPreset.prompt : '';
            const interpolatedScenePrompt = scenePromptTemplate.replace(/{subject}/g, selectedItem.subjectNoun);

            let finalInstruction = interpolatedScenePrompt;
            if (customPrompt.trim()) {
                finalInstruction += ` ${customPrompt.trim()}`;
            }

            const resultImageBase64 = await generateMockup(selectedFile, finalInstruction, {
                quality: 'high',
                format: selectedItem.formatSpec
            });

            // 1. Upload to Firebase Storage
            const timestamp = Date.now();
            const storagePath = `mockups/${currentUser.uid}/${timestamp}.png`;
            const storageRef = ref(storage, storagePath);
            await uploadString(storageRef, resultImageBase64, 'data_url');
            const downloadUrl = await getDownloadURL(storageRef);

            // 2. Save to Firestore (Generations Collection -> Public Feed)
            await addDoc(collection(db, 'generations'), {
                userId: currentUser.uid,
                userEmail: currentUser.email, // Optional: for display if profile is missing
                userDisplayName: currentUser.displayName || 'Anonymous',
                prompt: finalInstruction,
                url: downloadUrl,
                thumbnailUrl: downloadUrl,
                type: 'mockup',
                isPublic: true,
                createdAt: serverTimestamp(),
                modelId: 'gemini-2.5-flash-image', // Tagging the model
                presetId: selectedPresetId,
                itemId: selectedItemId,
                likes: 0
            });

            setGeneratedImageUrl(resultImageBase64); // Keep using base64 for immediate display if preferred, or use URL
            setAppState(AppState.RESULT);
        } catch (err) {
            console.error(err);
            setError(err.message || 'An unexpected error occurred while generating the mockup.');
            setAppState(AppState.PREVIEW);
        }
    };

    const handleBulkGenerate = async () => {
        if (!selectedFile) return;
        setAppState(AppState.BULK_GENERATING);
        setError(null);
        setBulkProgress(null);

        try {
            const resultZip = await bulkService.generateAll(selectedFile, (progress) => {
                setBulkProgress(prev => {
                    return {
                        ...progress,
                        lastImagePreview: progress.lastImagePreview || prev?.lastImagePreview
                    };
                });
            });

            if (resultZip) {
                setZipBlob(resultZip);
                setAppState(AppState.BULK_RESULT);
            } else {
                throw new Error("No mockups were generated successfully.");
            }
        } catch (err) {
            console.error(err);
            setError("Bulk generation failed. Please try again or use single generation.");
            setAppState(AppState.PREVIEW);
        }
    };

    const handleSurpriseMe = async () => {
        if (!selectedFile) return;
        setAppState(AppState.BULK_GENERATING);
        setError(null);
        setBulkProgress(null);

        try {
            const resultZip = await bulkService.generateRandomSubset(selectedFile, 3, (progress) => {
                setBulkProgress(prev => {
                    return {
                        ...progress,
                        lastImagePreview: progress.lastImagePreview || prev?.lastImagePreview
                    };
                });
            });

            if (resultZip) {
                setZipBlob(resultZip);
                setAppState(AppState.BULK_RESULT);
            } else {
                throw new Error("No mockups were generated successfully.");
            }
        } catch (err) {
            console.error(err);
            setError("Surprise generation failed. Please try again.");
            setAppState(AppState.PREVIEW);
        }
    };


    const handleReset = () => {
        setAppState(AppState.IDLE);
        setSelectedFile(null);
        setPreviewUrl(null);
        setGeneratedImageUrl(null);
        setZipBlob(null);
        setBulkProgress(null);
        setCustomPrompt('');
        setSelectedPresetId(presets[0]?.id || 'studio');
        setActiveCategory('All');
        setActiveProductCategory('All');
        setSearchQuery('');
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadZip = () => {
        if (zipBlob) {
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mockups-bundle-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const scrollCategories = (direction) => {
        if (categoryScrollRef.current) {
            const scrollAmount = 300;
            categoryScrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const downloadImage = () => {
        if (generatedImageUrl) {
            const a = document.createElement('a');
            a.href = generatedImageUrl;
            a.download = `mockup-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };


    return (
        <div className="mockup-studio-page">


            <main className="mockup-studio-main">

                {/* Error Notification */}
                {error && (
                    <div className="ms-error-alert">
                        <span className="font-bold">Error:</span> {error}
                        <button onClick={() => setError(null)} className="ms-error-close">✕</button>
                    </div>
                )}

                {/* State: IDLE (Upload Area) */}
                {appState === AppState.IDLE && (
                    <div className="ms-idle-container">
                        <div className="ms-title-block">
                            <h2>Mockup Studio</h2>
                            <p>Turn designs into photorealistic product shots instantly.</p>
                        </div>

                        <div
                            className={`ms-upload-dropzone ${isDragging ? 'is-dragging' : ''}`}
                            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onClick={triggerFileInput}
                        >
                            <div className="ms-dropzone-content">
                                <div className="ms-dropzone-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="ms-dropzone-text">
                                    <h3>Upload your design</h3>
                                    <p>Drag and drop or click to browse</p>
                                </div>
                                <div className="ms-file-formats">
                                    {['PNG', 'JPG', 'WEBP'].map(ext => (
                                        <span key={ext} className="ms-format-tag">{ext}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                    </div>
                )}

                {/* State: BULK RESULT */}
                {appState === AppState.BULK_RESULT && (
                    <div className="ms-bulk-result-container">
                        <h2>Collection Ready!</h2>
                        <div className="ms-bulk-actions">
                            <Button onClick={downloadZip} className="ms-btn-lg">Download ZIP</Button>
                            <Button variant="outline" onClick={handleReset} className="ms-btn-lg">Create New</Button>
                        </div>
                    </div>
                )}

                {/* State: RESULT (Single) */}
                {appState === AppState.RESULT && generatedImageUrl && (
                    <div className="ms-result-grid animate-fade-in">
                        {/* Image Display */}
                        <div className="ms-result-image-card">
                            <img src={generatedImageUrl} alt="Generated Mockup" />
                        </div>

                        {/* Actions */}
                        <div className="ms-result-details">
                            <h2>Your Mockup is Ready</h2>
                            <p>Generated with {selectedPreset ? selectedPreset.label : 'custom settings'}.</p>

                            <div className="ms-result-actions">
                                <Button onClick={downloadImage} className="ms-w-full ms-btn-lg">Download Image</Button>
                                <Button variant="outline" onClick={() => setAppState(AppState.PREVIEW)} className="ms-w-full">Make Another Variation</Button>
                                <Button variant="secondary" onClick={handleReset} className="ms-w-full">Start Over</Button>
                            </div>
                        </div>
                    </div>
                )}


                {/* State: PREVIEW & GENERATING */}
                {(appState === AppState.PREVIEW || appState === AppState.GENERATING || appState === AppState.BULK_GENERATING) && (
                    <div className={`ms-workspace-grid ${appState === AppState.RESULT ? 'hidden' : ''}`}>

                        {/* Left Column: Preview */}
                        <div className="ms-preview-column">
                            <div className="ms-preview-card">
                                <div className="ms-preview-header">
                                    <h3 className="ms-preview-label">Source</h3>
                                    <button onClick={handleReset} className="ms-replace-btn">Replace</button>
                                </div>
                                <div className="ms-preview-content">
                                    {previewUrl && (
                                        <div className="ms-preview-image-wrapper">
                                            <img src={previewUrl} alt="Preview" className={`${appState === AppState.GENERATING ? 'loading' : ''}`} />
                                            {appState === AppState.GENERATING && <div className="ms-preview-loader-overlay"><Spinner /></div>}
                                        </div>
                                    )}
                                </div>
                                {appState === AppState.BULK_GENERATING && bulkProgress && (
                                    <div className="ms-bulk-progress">
                                        <p>Generating... {bulkProgress.current} / {bulkProgress.total}</p>
                                        <div className="ms-progress-track">
                                            <div className="ms-progress-fill" style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Controls */}
                        <div className="ms-controls-column">
                            <div className="ms-main-controls-card">

                                {/* Product Selector */}
                                <section className="mb-6">
                                    <div className="flex flex-col gap-3 mb-4">
                                        <h2 className="ms-section-header">
                                            <span className="ms-accent-bar"></span> Select Product
                                        </h2>
                                        <input
                                            type="text" placeholder="Search..."
                                            className="ms-search-input"
                                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                        />
                                        {/* Categories */}
                                        <div className="ms-category-pills">
                                            {productCategories.map(cat => (
                                                <button
                                                    key={cat} onClick={() => setActiveProductCategory(cat)}
                                                    className={`ms-pill-btn ${activeProductCategory === cat ? 'active' : ''}`}
                                                >
                                                    {cat} <span className="count">{categoryCounts[cat]}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="ms-item-grid custom-scrollbar">
                                        {loadingItems ? (
                                            <div className="ms-full-span flex justify-center py-10 opacity-50">
                                                <Spinner />
                                            </div>
                                        ) : paginatedItems.map(item => (
                                            <button
                                                key={item.id} onClick={() => setSelectedItemId(item.id)}
                                                className={`ms-item-btn ${selectedItemId === item.id ? 'selected' : ''}`}
                                            >
                                                <div className="ms-item-icon">{item.icon}</div>
                                                <span className="ms-item-label">{item.label}</span>
                                            </button>
                                        ))}

                                        {filteredItems.length === 0 && !loadingItems && (
                                            <div className="ms-full-span py-10 text-center opacity-50">
                                                No products found matching your search or category.
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="ms-pagination">
                                            <button
                                                className="ms-page-nav-btn"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                aria-label="Previous page"
                                            >
                                                &larr;
                                            </button>

                                            <div className="ms-page-numbers">
                                                {getPageNumbers().map((p, i) => (
                                                    p === '...' ? (
                                                        <span key={`sep-${i}`} className="ms-page-sep">...</span>
                                                    ) : (
                                                        <button
                                                            key={p}
                                                            onClick={() => setCurrentPage(p)}
                                                            className={`ms-page-num-btn ${currentPage === p ? 'active' : ''}`}
                                                        >
                                                            {p}
                                                        </button>
                                                    )
                                                ))}
                                            </div>

                                            <button
                                                className="ms-page-nav-btn"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                aria-label="Next page"
                                            >
                                                &rarr;
                                            </button>
                                        </div>
                                    )}

                                    {/* Empty State / Initialize DB */}
                                    {!loadingItems && mockupItems.length === 0 && (
                                        <div className="ms-full-span py-10 text-center flex flex-col items-center gap-4">
                                            <p className="opacity-50">No products found. Database might be empty.</p>
                                            <Button
                                                onClick={async () => {
                                                    setLoadingItems(true);
                                                    try {
                                                        const { seedService } = await import('../../services/seedService');
                                                        await seedService.seedMockupItems();
                                                        mockupCache.invalidate(); // Clear cache to force reload
                                                        window.location.reload(); // Simple reload to fetch fresh
                                                    } catch (err) {
                                                        console.error(err);
                                                        setError('Failed to seed database.');
                                                        setLoadingItems(false);
                                                    }
                                                }}
                                            >
                                                Initialize Database
                                            </Button>
                                        </div>
                                    )}
                                </section>

                                {/* Scene Selector */}
                                <section className="mb-6">
                                    <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                                        <span className="ms-accent-bar"></span> Select Environment
                                    </h2>
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {presetCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveCategory(cat)}
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border transition-all ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="ms-preset-grid">
                                        {filteredPresets.map(preset => (
                                            <button key={preset.id} onClick={() => setSelectedPresetId(preset.id)} className={`ms-preset-btn ${selectedPresetId === preset.id ? 'selected' : ''}`}>
                                                <span className="ms-preset-icon">{preset.icon}</span>
                                                <span className="ms-preset-label">{preset.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Custom Prompt */}
                                <section className="ms-section">
                                    <label className="ms-input-label">Custom Details (Optional)</label>
                                    <input
                                        type="text"
                                        value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                                        className="ms-text-input"
                                        placeholder="E.g., pink lighting, Cyberpunk aesthetic..."
                                    />
                                </section>

                                <div className="ms-action-row">
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={appState !== AppState.PREVIEW}
                                        className="ms-flex-1 ms-btn-lg"
                                    >
                                        {appState === AppState.GENERATING ? 'Magically Rendering...' : 'Generate Mockup'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleSurpriseMe}
                                        disabled={appState !== AppState.PREVIEW}
                                    >
                                        Surprise Me (3x)
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

export default MockupStudio;
