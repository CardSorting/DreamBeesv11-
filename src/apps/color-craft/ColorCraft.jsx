import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import ImageCard from './components/ImageCard';
import JsonExportModal from './components/JsonExportModal';
import JsonImportModal from './components/JsonImportModal';
import { generateBookConcepts } from './services/geminiService';
import { useBatchProcessor } from './hooks/useBatchProcessor';
import { loadImages, saveImage, deleteImage, clearPendingImages } from './services/storage';
import { FileText, Play, Pause, XCircle, Loader2 } from 'lucide-react';

const BATCH_DELAY_MS = 3000;

const ColorCraft = () => {
    const [images, setImages] = useState([]);
    const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);
    const [error, setError] = useState(null);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isLoadingDB, setIsLoadingDB] = useState(true);

    // Queue Control
    const [isQueuePaused, setIsQueuePaused] = useState(false);

    // Use Custom Hook for Batch Processing
    const {
        batchTotal,
        batchProgress,
        pendingCount,
        generatingCount,
        activeCount,
        isProcessingBatch
    } = useBatchProcessor({
        images,
        setImages,
        isQueuePaused,
        batchDelayMs: BATCH_DELAY_MS
    });

    // Load from IndexedDB on mount
    useEffect(() => {
        const fetchImages = async () => {
            try {
                const loaded = await loadImages();
                // Reset 'generating' items to 'pending' on load to handle interrupted sessions
                const sanitized = loaded.map(img =>
                    img.status === 'generating' ? { ...img, status: 'pending' } : img
                );
                setImages(sanitized);
            } catch (e) {
                console.error("Failed to load images from DB", e);
            } finally {
                setIsLoadingDB(false);
            }
        };
        fetchImages();
    }, []);

    // Main Action: Create a 30-page book
    const handleCreateBook = async (theme, style) => {
        setIsGeneratingConcepts(true);
        setError(null);

        try {
            // Step 1: Generate Concepts
            const { pages: concepts, bookId } = await generateBookConcepts(theme, style);

            // Step 2: Convert to Pending Images
            const newImages = concepts.map(prompt => ({
                id: crypto.randomUUID(),
                prompt: prompt,
                style: style,
                bookId: bookId, // Attach Book ID
                createdAt: Date.now(),
                status: 'pending'
            }));

            // Step 3: Save to DB & State
            // We save individually to be safe
            for (const img of newImages) {
                await saveImage(img);
            }

            setImages(prev => [...newImages, ...prev]);
            setIsQueuePaused(false); // Ensure queue runs

            // Smooth scroll to gallery
            setTimeout(() => {
                const galleryElement = document.getElementById('gallery-section');
                if (galleryElement) {
                    galleryElement.scrollIntoView({ behavior: 'smooth' });
                }
            }, 500);

        } catch (err) {
            console.error("Book Creation Error:", err);
            setError(err.message || "Failed to create book concepts. Please try again.");
        } finally {
            setIsGeneratingConcepts(false);
        }
    };

    const handleDelete = async (id) => {
        const img = images.find(i => i.id === id);
        // Allow deleting pending/error items without confirmation
        if (img && (img.status === 'pending' || img.status === 'error')) {
            await deleteImage(id);
            setImages((prev) => prev.filter((i) => i.id !== id));
            return;
        }

        if (window.confirm("Are you sure you want to delete this page?")) {
            await deleteImage(id);
            setImages((prev) => prev.filter((i) => i.id !== id));
        }
    };

    const handleClearQueue = async () => {
        if (window.confirm("Remove all pending items from the queue?")) {
            await clearPendingImages();
            setImages(prev => prev.filter(img => img.status !== 'pending'));
        }
    };

    const handleImport = async (importedImages) => {
        for (const img of importedImages) {
            await saveImage(img);
        }
        setImages((prev) => {
            const existingIds = new Set(prev.map(img => img.id));
            const uniqueImported = importedImages.filter(img => !existingIds.has(img.id));
            return [...uniqueImported, ...prev];
        });
        setIsQueuePaused(false);
    };

    if (isLoadingDB) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p>Loading Gallery...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
            <Header onImportClick={() => setIsImportModalOpen(true)} />

            {/* Queue Control Bar (Sticky) */}
            {isProcessingBatch && (
                <div className="bg-indigo-900 text-white sticky top-0 z-40 shadow-lg animate-in slide-in-from-top-2 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            {isQueuePaused ? (
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Pause className="w-5 h-5 text-amber-300" />
                                </div>
                            ) : (
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-300" />
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-white">
                                        {isQueuePaused ? "Batch Paused" : "Producing Book..."}
                                    </p>
                                    <span className="text-xs bg-indigo-800 px-2 py-0.5 rounded-full text-indigo-200">
                                        {Math.max(0, batchTotal - activeCount)} / {batchTotal}
                                    </span>
                                </div>
                                <p className="text-xs text-indigo-300 mt-0.5">
                                    {pendingCount} pending · {generatingCount} generating
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsQueuePaused(!isQueuePaused)}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-xs font-medium transition-colors border border-indigo-700 hover:border-indigo-600"
                            >
                                {isQueuePaused ? (
                                    <> <Play className="w-3.5 h-3.5" /> Resume </>
                                ) : (
                                    <> <Pause className="w-3.5 h-3.5" /> Pause </>
                                )}
                            </button>
                            <button
                                onClick={handleClearQueue}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-800/50 hover:bg-red-900/80 text-xs font-medium transition-colors text-indigo-200 hover:text-white border border-indigo-700/50 hover:border-red-800"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Cancel</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar Background */}
                    <div className="absolute bottom-0 left-0 h-1 bg-indigo-950 w-full z-0">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-500 ease-out"
                            style={{ width: `${batchProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Hero / Wizard Section */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                            Auto <span className="text-indigo-600">Coloring Book</span> Maker
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Generate a complete 30-page coloring book from a single theme.
                        </p>
                    </div>

                    <PromptInput
                        onCreateBook={handleCreateBook}
                        isGeneratingConcepts={isGeneratingConcepts}
                        error={error}
                    />
                </div>

                {/* Gallery Section */}
                {images.length > 0 && (
                    <div id="gallery-section" className="mt-12 border-t border-slate-200 pt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                Your Book Pages
                                <span className="bg-slate-100 text-slate-600 text-sm py-0.5 px-2 rounded-full">{images.length}</span>
                            </h3>

                            <button
                                onClick={() => setIsJsonModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                            >
                                <FileText className="w-4 h-4" />
                                Export Book
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {images.map((img) => (
                                <ImageCard key={img.id} image={img} onDelete={handleDelete} />
                            ))}
                        </div>
                    </div>
                )}

                {images.length === 0 && !isGeneratingConcepts && (
                    <div className="text-center py-12 opacity-50">
                        <p className="text-slate-400">Generated pages will appear here in real-time.</p>
                    </div>
                )}
            </main>

            <footer className="bg-white border-t border-slate-200 py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
                    <p>© {new Date().getFullYear()} ColorCraft AI. Powered by Google Gemini.</p>
                </div>
            </footer>

            {/* Export Modal */}
            <JsonExportModal
                isOpen={isJsonModalOpen}
                onClose={() => setIsJsonModalOpen(false)}
                images={images}
            />

            {/* JSON Import Modal */}
            <JsonImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
            />
        </div>
    );
};

export default ColorCraft;
