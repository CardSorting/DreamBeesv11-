import React, { useState, useRef, useEffect } from 'react';
import './MockupStudio.css';

import { Button } from './components/Button';
import { bulkService } from './services/bulkService';
import { useAuth } from '../../contexts/AuthContext';
import { useUserInteractions } from '../../contexts/UserInteractionsContext';
import BeeCrateScene from './BeeCrateScene';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const AppState = {
    IDLE: 'IDLE',          // Waiting for coin (image)
    READY: 'READY',        // Image inserted, ready to spin
    SPINNING: 'SPINNING',  // Generating
    PRIZE: 'PRIZE'         // Results shown
};

const MockupStudio = () => {
    const { currentUser } = useAuth();
    const { userProfile = {} } = useUserInteractions();

    const [appState, setAppState] = useState(AppState.IDLE);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Gacha Results
    const [gachaPrizes, setGachaPrizes] = useState([]);
    const [zipBlob, setZipBlob] = useState(null);
    const [spinProgress, setSpinProgress] = useState(null);
    const [isTCGMode, setIsTCGMode] = useState(false);

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
                        image: base64Token,
                        mode: isTCGMode ? 'tcg' : 'standard'
                    });

                    if (result.data && result.data.success && result.data.prizes) {
                        const prizes = result.data.prizes;

                        // Save Metadata to Firestore in parallel (Defensive)
                        // Save Metadata to Firestore in parallel (Defensive)
                        const savePromises = prizes.map(async (prize) => {
                            try {
                                await addDoc(collection(db, 'images'), {
                                    userId: currentUser.uid,
                                    userEmail: currentUser.email,
                                    userDisplayName: (userProfile?.displayPreference === 'username' && userProfile?.username)
                                        ? `@${userProfile.username}`
                                        : (currentUser.displayName || 'Anonymous'),
                                    prompt: prize.prompt,
                                    imageUrl: prize.url,
                                    thumbnailUrl: prize.url,
                                    type: 'mockup',
                                    isPublic: true,
                                    createdAt: serverTimestamp(),
                                    modelId: 'gemini-2.5-flash-image',
                                    mockupLabel: prize.label,
                                    presetLabel: prize.presetLabel,
                                    likesCount: 0,
                                    bookmarksCount: 0
                                });
                            } catch (fireError) {
                                console.error("Failed to save to gallery:", fireError);
                            }
                        });

                        // We don't await this strictly for the UI to update, but usually good to finish before "done"
                        // But to be super responsive, we can set state immediately? 
                        // Let's stick to awaiting but with the catch above, it won't fail global Promise.all
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
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Render Helper: Mode Toggle
    const renderModeToggle = () => (
        <div className="mode-toggle-container w-full flex flex-col items-center">
            {/* The wrapper gets data-mode attribute to drive CSS */}
            <div className="premium-toggle-wrapper" data-mode={isTCGMode ? 'tcg' : 'standard'}>

                {/* Sliding Background (positioned by CSS based on data-mode) */}
                <div className="premium-toggle-slider"></div>

                {/* Standard Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsTCGMode(false); }}
                    className={`premium-toggle-btn ${!isTCGMode ? 'active' : 'inactive'}`}
                >
                    <span className="text-lg">🍯</span> Standard
                </button>

                {/* TCG Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsTCGMode(true); }}
                    className={`premium-toggle-btn ${isTCGMode ? 'active' : 'inactive'}`}
                >
                    <span className="text-lg">🃏</span> TCG Mode
                </button>
            </div>

            <p className="premium-toggle-subtext">
                {isTCGMode ? "Authentic Trading Card Mockups" : "Standard Hive Product Mockups"}
            </p>
        </div>
    );

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

                {/* Machine Container - Split Layout (unless PRIZE) */}
                <div className={`gacha-machine-container ${appState !== AppState.PRIZE ? 'split-layout' : 'full-layout'}`}>

                    {/* Left Panel: Controls & HUD */}
                    <div className="gacha-ui-panel">

                        {/* STATE: IDLE (Coin/Token Slot) */}
                        {appState === AppState.IDLE && (
                            <div className="w-full flex flex-col items-center">
                                {/* Toggle Visible in Idle too */}
                                {renderModeToggle()}

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
                            </div>
                        )}

                        {/* STATE: READY (Crank It) */}
                        {appState === AppState.READY && (
                            <div className="gacha-control-group animate-fade-in">
                                <div className="token-preview-card">
                                    <div className="gacha-preview-token honeycomb-border">
                                        <img src={previewUrl} alt="Your Token" />
                                    </div>
                                    <p className="token-label">Nectar Ready!</p>
                                </div>

                                {renderModeToggle()}

                                <div className="action-buttons">
                                    <Button onClick={handleGachaSpin} className="gacha-crank-btn bee-btn">
                                        Open Hives
                                    </Button>
                                    <button onClick={handleReset} className="gacha-reset-text">
                                        Discard
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STATE: SPINNING (Status) */}
                        {appState === AppState.SPINNING && (
                            <div className="gacha-status-display animate-fade-in">
                                <div className="spinner-loader"></div>
                                <div className="gacha-status-text">
                                    {spinProgress ?
                                        `Extracting Honey ${spinProgress.current}/${spinProgress.total}` :
                                        "Buzzing..."}
                                </div>
                            </div>
                        )}

                        {/* STATE: PRIZE (Results Grid) */}
                        {appState === AppState.PRIZE && (
                            <div className="gacha-results-panel animate-fade-in">
                                <h2>Fresh Honey!</h2>

                                {gachaPrizes.length === 1 ? (
                                    // Single Result (Hero Layout)
                                    <div className="gacha-single-result animate-pop-in">
                                        <div className="single-image-container">
                                            <img src={gachaPrizes[0].url} alt={gachaPrizes[0].label} />
                                            <div className="single-overlay">
                                                <span className="single-label">{gachaPrizes[0].label}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Multiple Results (Grid Layout)
                                    <div className="gacha-results-grid">
                                        {gachaPrizes.map((prize, idx) => (
                                            <div key={prize.id} className="gacha-grid-item animate-pop-in" style={{ animationDelay: `${idx * 150}ms` }}>
                                                <div className="grid-image-container">
                                                    <img src={prize.url} alt={prize.label} />
                                                    <div className="grid-overlay">
                                                        <span className="grid-label">{prize.label}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button variant="outline" onClick={handleReset} className="btn-secondary full-width">
                                    Harvest More
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: 3D Stage (Hide when showing prizes) */}
                    {appState !== AppState.PRIZE && (
                        <div className="gacha-3d-stage">
                            <BeeCrateScene appState={appState} />
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

export default MockupStudio;
