import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import ImageCard from './components/ImageCard';
import JsonExportModal from './components/JsonExportModal';
import JsonImportModal from './components/JsonImportModal';
import { generateColoringPage } from './services/geminiService';
import { loadImages, saveImage, deleteImage } from './services/storage';
import { FileText, Loader2 } from 'lucide-react';
import './ColorCraft.css';

const ColorCraft = () => {
    const [images, setImages] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isLoadingDB, setIsLoadingDB] = useState(true);

    // Load from IndexedDB on mount
    useEffect(() => {
        const fetchImages = async () => {
            try {
                const loaded = await loadImages();
                setImages(loaded);
            } catch (e) {
                console.error("Failed to load images from DB", e);
            } finally {
                setIsLoadingDB(false);
            }
        };
        fetchImages();
    }, []);

    // Main Action: Create a single page
    const handleCreateImage = async (prompt, style) => {
        setIsGenerating(true);
        setError(null);

        try {
            const imageUrl = await generateColoringPage(prompt, style);

            const newImage = {
                id: crypto.randomUUID(),
                prompt: prompt,
                style: style,
                imageUrl: imageUrl,
                createdAt: Date.now(),
                status: 'completed'
            };

            await saveImage(newImage);
            setImages(prev => [newImage, ...prev]);

        } catch (err) {
            console.error("Image Creation Error:", err);
            setError(err.message || "Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this page?")) {
            await deleteImage(id);
            setImages((prev) => prev.filter((i) => i.id !== id));
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

            <main className="cc-main">

                {/* Hero / Wizard Section */}
                <div className="cc-hero-section">
                    <div className="cc-hero-text-center">
                        <h2 className="cc-hero-title">
                            AI <span style={{ color: '#4f46e5' }}>Coloring Page</span> Maker
                        </h2>
                        <p className="cc-hero-subtitle">
                            Generate beautiful coloring pages instantly.
                        </p>
                    </div>

                    <PromptInput
                        onCreateImage={handleCreateImage}
                        isGenerating={isGenerating}
                        error={error}
                    />
                </div>

                {/* Gallery Section */}
                {images.length > 0 && (
                    <div id="gallery-section" className="cc-gallery-section" style={{ animation: 'cc-slide-in-top 0.7s ease-out' }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Your Coloring Pages
                                <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.875rem', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{images.length}</span>
                            </h3>

                            <button
                                onClick={() => setIsJsonModalOpen(true)}
                                className="cc-btn cc-btn-white"
                            >
                                <FileText style={{ width: '1rem', height: '1rem' }} />
                                Export History
                            </button>
                        </div>

                        <div className="cc-gallery-grid">
                            {images.map((img) => (
                                <ImageCard key={img.id} image={img} onDelete={handleDelete} />
                            ))}
                        </div>
                    </div>
                )}

                {images.length === 0 && !isGenerating && (
                    <div className="text-center py-12 opacity-50">
                        <p className="text-slate-400">Generated pages will appear here.</p>
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
