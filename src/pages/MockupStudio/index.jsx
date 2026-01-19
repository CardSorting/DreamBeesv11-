import React, { useState, useRef, useMemo, useEffect } from 'react';

import { Button } from './components/Button';
import { Spinner } from './components/Spinner';
import { generateMockup } from './services/geminiService';
import { bulkService } from './services/bulkService';
import { presetFactory } from './services/PresetFactory';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Icons } from './components/MockupIcons';

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

    const fileInputRef = useRef(null);

    const presetCategories = ['All', 'Studio', 'Lifestyle', 'Nature', 'Urban', 'Vintage'];
    const productCategories = [
        'All',
        'Vehicles', 'Electronics', 'Anime',
        'Home', 'Bedroom', 'Bathroom', 'Pets', 'Tools',
        'Bakery', 'Kitchen', 'Dining',
        'Candy', 'Snacks', 'Drinks', 'Bottled', 'Canned', 'Freezer',
        'Stickers', 'Packaging', 'Medical', 'Signs', 'Print', 'Apparel', 'Accessories', 'Media', 'Toys', 'Sports', 'Jewelry', 'Acrylic'
    ];

    // Fetch Mockup Items
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const q = query(collection(db, 'mockup_items'));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const items = snapshot.docs.map(doc => {
                        const data = doc.data();
                        const IconComponent = Icons[data.iconName] || Icons.Print; // Fallback
                        return {
                            id: doc.id,
                            ...data,
                            icon: <IconComponent className="w-8 h-8" />
                        };
                    });
                    // specific sort if needed, otherwise random/insertion order
                    setMockupItems(items);
                    if (items.length > 0) {
                        setSelectedItemId(items[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load mockup items:", err);
                setError("Failed to load available products.");
            } finally {
                setLoadingItems(false);
            }
        };
        fetchItems();
    }, []);

    // Icons for Categories (SVG strings ported)
    const categoryIcons = {
        All: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>),
        Vehicles: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14l-2.5-5h-9L5 12z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z" /></svg>),
        Electronics: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>),
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
                item.subjectNoun.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q)
            );
        }
        return items;
    }, [mockupItems, activeProductCategory, searchQuery]);

    // Calculate counts for badges
    const categoryCounts = useMemo(() => {
        const counts = { All: mockupItems.length };
        productCategories.forEach(cat => {
            if (cat !== 'All') {
                counts[cat] = mockupItems.filter(i => i.category === cat).length;
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

            const resultImage = await generateMockup(selectedFile, finalInstruction, {
                quality: 'high',
                format: selectedItem.formatSpec
            });

            setGeneratedImageUrl(resultImage);
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


    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">


            <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col">

                {/* Error Notification */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative flex items-center gap-3">
                        <span className="font-bold">Error:</span> {error}
                        <button onClick={() => setError(null)} className="ml-auto">✕</button>
                    </div>
                )}

                {/* State: IDLE (Upload Area) */}
                {appState === AppState.IDLE && (
                    <div className="flex-grow flex flex-col items-center justify-center py-12">
                        <div className="text-center space-y-4 max-w-2xl mb-12">
                            <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">Mockup Studio</h2>
                            <p className="text-xl text-slate-500 font-light">Turn designs into photorealistic product shots instantly.</p>
                        </div>

                        <div
                            className={`relative w-full max-w-3xl aspect-[2/1] min-h-[320px] rounded-3xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer group flex flex-col items-center justify-center p-8 ${isDragging ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'}`}
                            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onClick={triggerFileInput}
                        >
                            <div className="flex flex-col items-center space-y-6">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-semibold text-slate-900">Upload your design</h3>
                                    <p className="text-slate-500 text-sm">Drag and drop or click to browse</p>
                                </div>
                                <div className="flex gap-2">
                                    {['PNG', 'JPG', 'WEBP'].map(ext => (
                                        <span key={ext} className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{ext}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                    </div>
                )}

                {/* State: BULK RESULT */}
                {appState === AppState.BULK_RESULT && (
                    <div className="max-w-4xl mx-auto w-full mt-12 bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Collection Ready!</h2>
                        <div className="flex justify-center gap-4 mt-8">
                            <Button onClick={downloadZip} className="px-8 py-4 text-lg">Download ZIP</Button>
                            <Button variant="outline" onClick={handleReset} className="px-8 py-4 text-lg">Create New</Button>
                        </div>
                    </div>
                )}

                {/* State: RESULT (Single) */}
                {appState === AppState.RESULT && generatedImageUrl && (
                    <div className="max-w-6xl mx-auto w-full mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        {/* Image Display */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2 overflow-hidden">
                            <img src={generatedImageUrl} alt="Generated Mockup" className="w-full h-auto rounded-xl" />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col justify-center space-y-6">
                            <h2 className="text-3xl font-bold">Your Mockup is Ready</h2>
                            <p className="text-slate-600">Generated with {selectedPreset ? selectedPreset.label : 'custom settings'}.</p>

                            <div className="flex flex-col gap-4">
                                <Button onClick={downloadImage} className="w-full py-4 text-lg">Download Image</Button>
                                <Button variant="outline" onClick={() => setAppState(AppState.PREVIEW)} className="w-full py-4">Make Another Variation</Button>
                                <Button variant="secondary" onClick={handleReset} className="w-full py-4">Start Over</Button>
                            </div>
                        </div>
                    </div>
                )}


                {/* State: PREVIEW & GENERATING */}
                {(appState === AppState.PREVIEW || appState === AppState.GENERATING || appState === AppState.BULK_GENERATING) && (
                    <div className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4 ${appState === AppState.RESULT ? 'hidden' : ''}`}>

                        {/* Left Column: Preview */}
                        <div className="lg:col-span-4 flex flex-col space-y-4">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col sticky top-24">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Source</h3>
                                    <button onClick={handleReset} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Replace</button>
                                </div>
                                <div className="p-6 bg-slate-50 flex items-center justify-center min-h-[300px]">
                                    {previewUrl && (
                                        <div className="relative shadow-xl rounded-lg overflow-hidden">
                                            <img src={previewUrl} alt="Preview" className={`max-w-full max-h-[400px] object-contain ${appState === AppState.GENERATING ? 'opacity-50 blur-sm' : ''}`} />
                                            {appState === AppState.GENERATING && <div className="absolute inset-0 flex items-center justify-center"><Spinner /></div>}
                                        </div>
                                    )}
                                </div>
                                {appState === AppState.BULK_GENERATING && bulkProgress && (
                                    <div className="p-4 bg-indigo-50 border-t border-indigo-100">
                                        <p className="text-indigo-700 font-bold mb-2">Generating... {bulkProgress.current} / {bulkProgress.total}</p>
                                        <div className="w-full bg-indigo-200 rounded-full h-2">
                                            <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Controls */}
                        <div className="lg:col-span-8 flex flex-col space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">

                                {/* Product Selector */}
                                <section className="mb-10">
                                    <div className="flex flex-col gap-6 mb-6">
                                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                <span className="w-1 h-6 bg-indigo-600 rounded-full"></span> Select Product
                                            </h2>
                                            <input
                                                type="text" placeholder="Search..."
                                                className="border border-slate-200 rounded-lg px-4 py-2 w-full sm:w-64"
                                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        {/* Categories */}
                                        <div className="flex flex-wrap gap-2">
                                            {productCategories.map(cat => (
                                                <button
                                                    key={cat} onClick={() => setActiveProductCategory(cat)}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${activeProductCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
                                                >
                                                    {cat} <span className="opacity-50 ml-1">{categoryCounts[cat]}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {loadingItems ? (
                                            <div className="col-span-full flex justify-center py-10 opacity-50">
                                                <Spinner />
                                            </div>
                                        ) : filteredItems.map(item => (
                                            <button
                                                key={item.id} onClick={() => setSelectedItemId(item.id)}
                                                className={`flex flex-col items-center justify-center p-2 rounded-xl border aspect-square transition-all ${selectedItemId === item.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                                            >
                                                <div className="text-2xl mb-2 flex items-center justify-center">{item.icon}</div>
                                                <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Scene Selector */}
                                <section className="mb-10">
                                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                        <span className="w-1 h-6 bg-indigo-600 rounded-full"></span> Select Environment
                                    </h2>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {presetCategories.map(cat => (
                                            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {filteredPresets.map(preset => (
                                            <button key={preset.id} onClick={() => setSelectedPresetId(preset.id)} className={`flex flex-col items-center p-3 rounded-xl border text-center ${selectedPresetId === preset.id ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600' : 'border-slate-100 bg-white hover:border-indigo-200'}`}>
                                                <span className="text-2xl mb-1">{preset.icon}</span>
                                                <span className={`text-xs font-bold ${selectedPresetId === preset.id ? 'text-indigo-900' : 'text-slate-700'}`}>{preset.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Custom Prompt */}
                                <section className="mb-8">
                                    <label className="block text-sm font-bold mb-2">Custom Details (Optional)</label>
                                    <input
                                        type="text"
                                        value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                        placeholder="E.g., pink lighting, Cyberpunk aesthetic..."
                                    />
                                </section>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={appState !== AppState.PREVIEW}
                                        className="flex-1 py-4 text-lg shadow-indigo-200 shadow-lg"
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
