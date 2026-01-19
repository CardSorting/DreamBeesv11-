import React, { useState, useRef, useEffect } from 'react';
import './MockupStudio.css';

import { Button } from './components/Button';
import { bulkService } from './services/bulkService';
import { useAuth } from '../../contexts/AuthContext';
import BeeCrateScene from './BeeCrateScene';

const AppState = {
    IDLE: 'IDLE',          // Waiting for coin (image)
    READY: 'READY',        // Image inserted, ready to spin
    SPINNING: 'SPINNING',  // Generating
    PRIZE: 'PRIZE'         // Results shown
};

const MockupStudio = () => {
    const { currentUser } = useAuth();
    const [appState, setAppState] = useState(AppState.IDLE);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Gacha Results
    const [gachaPrizes, setGachaPrizes] = useState([]);
    const [zipBlob, setZipBlob] = useState(null);
    const [spinProgress, setSpinProgress] = useState(null);

    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Cleanup preview URL
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
                setAppState(AppState.READY);
                setError(null);
            } else {
                setError('Please insert a valid image token (PNG, JPG, WEBP).');
            }
        }
    };

    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        validateAndSetFile(file);
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    const handleGachaSpin = async () => {
        if (!selectedFile) return;
        if (!currentUser) {
            setError('Please sign in to play the Gachapon.');
            return;
        }

        setAppState(AppState.SPINNING);
        setError(null);
        setSpinProgress(null);

        try {
            // Read file as base64
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);

            reader.onload = async () => {
                const base64Token = reader.result;

                try {
                    const { httpsCallable } = await import('firebase/functions');
                    const { functions } = await import('../../firebase');
                    const apiFn = httpsCallable(functions, 'api');

                    const result = await apiFn({
                        action: 'gachaSpin',
                        image: base64Token
                    });

                    if (result.data && result.data.success && result.data.prizes) {
                        const prizes = result.data.prizes;

                        // Save Metadata to Firestore in parallel
                        const savePromises = prizes.map(async (prize) => {
                            await addDoc(collection(db, 'generations'), {
                                userId: currentUser.uid,
                                userEmail: currentUser.email,
                                userDisplayName: currentUser.displayName || 'Anonymous',
                                prompt: prize.prompt,
                                url: prize.url,
                                thumbnailUrl: prize.url,
                                type: 'mockup',
                                isPublic: true,
                                createdAt: serverTimestamp(),
                                modelId: 'gemini-2.5-flash-image',
                                mockupLabel: prize.label,
                                presetLabel: prize.presetLabel,
                                likes: 0
                            });
                        });

                        await Promise.all(savePromises);

                        setGachaPrizes(prizes);
                        setAppState(AppState.PRIZE);
                    } else {
                        throw new Error("The machine got jammed! No prizes out.");
                    }
                } catch (apiError) {
                    console.error(apiError);
                    setError(apiError.message || "Gachapon jammed! Please try again.");
                    setAppState(AppState.READY);
                }
            };

            reader.onerror = () => {
                setError("Failed to read token image.");
                setAppState(AppState.READY);
            };

        } catch (err) {
            console.error(err);
            setError("Gachapon jammed! Please try again.");
            setAppState(AppState.READY);
        }
    };

    const handleReset = () => {
        setAppState(AppState.IDLE);
        setSelectedFile(null);
        setPreviewUrl(null);
        setGachaPrizes([]);
        setSpinProgress(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="gacha-page bee-theme">
            <main className="gacha-main">

                {/* Title */}
                <header className="gacha-header">
                    <h1>Bee Crate</h1>
                    <p>Deposit your design. Harvest 3 surprise honey-crates.</p>
                </header>

                {/* Error Notification */}
                {error && (
                    <div className="ms-error-alert">
                        <span className="font-bold">Buzz Kill:</span> {error}
                        <button onClick={() => setError(null)} className="ms-error-close">✕</button>
                    </div>
                )}

                {/* Machine Container */}
                <div className="gacha-machine-container">

                    {/* 3D Scene Layer - Always rendered for smooth transitions */}
                    <div className="gacha-3d-layer">
                        <BeeCrateScene appState={appState} />
                    </div>

                    {/* UI Layer */}
                    <div className="gacha-ui-layer">
                        {/* STATE: IDLE (Coin/Token Slot) */}
                        {appState === AppState.IDLE && (
                            <div className={`gacha-slot-area ${isDragging ? 'is-dragging' : ''}`}
                                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver} onDrop={handleDrop}
                                onClick={triggerFileInput}>

                                <div className="gacha-slot-visual">
                                    <div className="gacha-coin-slot beehive-slot">
                                        <div className="gacha-insert-label">DEPOSIT NECTAR</div>
                                    </div>
                                </div>

                                <p className="gacha-instruction">Drop your design here to feed the hive</p>
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                            </div>
                        )}

                        {/* STATE: READY (Crank It) */}
                        {appState === AppState.READY && (
                            <div className="gacha-crank-area animate-fade-in">
                                <div className="gacha-preview-token honeycomb-border">
                                    <img src={previewUrl} alt="Your Token" />
                                </div>
                                <div className="gacha-controls">
                                    <Button onClick={handleGachaSpin} className="gacha-crank-btn bee-btn">
                                        OPEN HIVES
                                    </Button>
                                    <button onClick={handleReset} className="gacha-reset-text">
                                        Discard Nectar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STATE: SPINNING (Animation) */}
                        {appState === AppState.SPINNING && (
                            <div className="gacha-spinning-area animate-fade-in">
                                {/* Visual is now handled by 3D Scene */}
                                <div className="gacha-status-text">
                                    {spinProgress ?
                                        `Extracting Honey ${spinProgress.current}/${spinProgress.total}...` :
                                        " buzzing..."}
                                </div>
                            </div>
                        )}

                        {/* STATE: PRIZE (Results) */}
                        {appState === AppState.PRIZE && (
                            <div className="gacha-prize-area animate-fade-in">
                                <h2>🍯 FRESH HONEY! 3 CRATES UNLOCKED! 🍯</h2>

                                <div className="gacha-capsules-grid">
                                    {gachaPrizes.map((prize, idx) => (
                                        <div key={prize.id} className="gacha-capsule-card animate-pop-in" style={{ animationDelay: `${idx * 150}ms` }}>
                                            <div className="gacha-capsule-img honey-cell-img">
                                                <img src={prize.url} alt={prize.label} />
                                            </div>
                                            <div className="gacha-capsule-info">
                                                <span className="prize-name">{prize.label}</span>
                                                <span className="prize-rarity">{prize.presetLabel}</span>
                                                <a href={prize.url} download={prize.filename} className="prize-download-btn">
                                                    Download Honey
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="gacha-actions">
                                    <Button variant="outline" onClick={handleReset} className="btn-secondary">Harvest More</Button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}

export default MockupStudio;
