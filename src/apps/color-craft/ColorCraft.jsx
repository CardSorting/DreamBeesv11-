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
import './ColorCraft.css';


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
            <div className="cc-flex-center" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#94a3b8' }}>
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="cc-animate-spin" style={{ width: '2rem', height: '2rem', color: '#6366f1' }} />
                    <p>Loading Gallery...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="cc-app-container">
            <Header onImportClick={() => setIsImportModalOpen(true)} />

            {/* Queue Control Bar (Sticky) */}
            {isProcessingBatch && (
                <div className="cc-queue-bar">
                    <div className="cc-queue-content">
                        <div className="flex items-center gap-4">
                            {isQueuePaused ? (
                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: '0.5rem' }}>
                                    <Pause style={{ width: '1.25rem', height: '1.25rem', color: '#fcd34d' }} />
                                </div>
                            ) : (
                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', borderRadius: '0.5rem' }}>
                                    <Loader2 className="cc-animate-spin" style={{ width: '1.25rem', height: '1.25rem', color: '#a5b4fc' }} />
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>
                                        {isQueuePaused ? "Batch Paused" : "Producing Book..."}
                                    </p>
                                    <span style={{ fontSize: '0.75rem', backgroundColor: '#3730a3', padding: '0.125rem 0.5rem', borderRadius: '9999px', color: '#c7d2fe' }}>
                                        {Math.max(0, batchTotal - activeCount)} / {batchTotal}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#a5b4fc', marginTop: '0.125rem' }}>
                                    {pendingCount} pending · {generatingCount} generating
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsQueuePaused(!isQueuePaused)}
                                className="cc-btn cc-btn-primary cc-hidden-sm"
                                style={{ backgroundColor: '#3730a3', borderColor: '#4338ca' }}
                            >
                                {isQueuePaused ? (
                                    <> <Play style={{ width: '0.875rem', height: '0.875rem' }} /> Resume </>
                                ) : (
                                    <> <Pause style={{ width: '0.875rem', height: '0.875rem' }} /> Pause </>
                                )}
                            </button>
                            <button
                                onClick={handleClearQueue}
                                className="cc-btn cc-flex-center"
                                style={{ backgroundColor: 'rgba(55, 48, 163, 0.5)', color: '#c7d2fe' }}
                            >
                                <XCircle style={{ width: '0.875rem', height: '0.875rem' }} />
                                <span className="cc-hidden-sm">Cancel</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar Background */}
                    <div className="cc-progress-bg">
                        <div
                            className="cc-progress-bar"
                            style={{ width: `${batchProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <main className="cc-main">

                {/* Hero / Wizard Section */}
                <div className="cc-hero-section">
                    <div className="cc-hero-text-center">
                        <h2 className="cc-hero-title">
                            Auto <span style={{ color: '#4f46e5' }}>Coloring Book</span> Maker
                        </h2>
                        <p className="cc-hero-subtitle">
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
                    <div id="gallery-section" className="cc-gallery-section" style={{ animation: 'cc-slide-in-top 0.7s ease-out' }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Your Book Pages
                                <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.875rem', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{images.length}</span>
                            </h3>

                            <button
                                onClick={() => setIsJsonModalOpen(true)}
                                className="cc-btn cc-btn-white"
                            >
                                <FileText style={{ width: '1rem', height: '1rem' }} />
                                Export Book
                            </button>
                        </div>

                        <div className="cc-gallery-grid">
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

            <footer style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '2rem 0', marginTop: '3rem' }}>
                <div className="cc-main" style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
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
