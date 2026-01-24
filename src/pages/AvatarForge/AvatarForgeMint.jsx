import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { Zap, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import BeeCrateScene from '../MockupStudio/BeeCrateScene';

export default function AvatarForgeMint() {
    const { currentUser } = useAuth();
    const { call: apiCall } = useApi();

    const [appState, setAppState] = useState('IDLE'); // IDLE, SPINNING, PRIZE
    const [prize, setPrize] = useState(null);
    const [isMinting, setIsMinting] = useState(false);

    const handleMint = async () => {
        if (!currentUser) return toast.error("Please sign in to mint!");
        if (isMinting) return;

        setIsMinting(true);
        setAppState('SPINNING');
        const toastId = toast.loading("Disconnecting Reality...");

        try {
            // Wait for at least 3 seconds for animation effect
            const apiPromise = apiCall('api', { action: 'mintRandomAvatar' });
            const delayPromise = new Promise(resolve => setTimeout(resolve, 3000));

            const [result] = await Promise.all([apiPromise, delayPromise]);

            if (result && result.data.success) {
                setPrize(result.data.prize);
                setAppState('PRIZE');
                toast.success("Artifact Acquired!", { id: toastId });
            } else {
                throw new Error("Machine jammed!");
            }
        } catch (error) {
            console.error("Mint failed:", error);
            setAppState('IDLE');
            toast.error(error.message || "Minting failed. No Zaps were spent.", { id: toastId });
        } finally {
            setIsMinting(false);
        }
    };

    const resetMachine = () => {
        setAppState('IDLE');
        setPrize(null);
    };

    return (
        <section className="forge-immersive-container">
            <div className="forge-machine-container">
                {/* Left Panel: UI & Controls */}
                <div className="forge-ui-panel">
                    <div className="ui-header">
                        <h1 className="ui-title">Soul Gacha</h1>
                        <p className="ui-subtitle">Extract a unique persona from the ether.</p>
                    </div>

                    <div className="ui-main-content">
                        {appState === 'IDLE' && (
                            <div className="state-idle animate-fade-in">
                                <div className="instruction-card">
                                    <Zap size={32} className="text-yellow-400 mb-4" />
                                    <p>Insert 2 Zaps to spin the Quantum Forge.</p>
                                </div>
                                <button
                                    className="forge-crank-btn"
                                    onClick={handleMint}
                                    disabled={isMinting}
                                >
                                    IGNITE FORGE
                                </button>
                            </div>
                        )}

                        {appState === 'SPINNING' && (
                            <div className="state-spinning animate-fade-in">
                                <div className="spinner-loader-large"></div>
                                <p className="spinning-text">Materializing...</p>
                            </div>
                        )}

                        {appState === 'PRIZE' && prize && (
                            <div className="state-prize animate-pop-in">
                                <div className="prize-showcase">
                                    <img src={prize.url} alt="Prize" className="prize-image-large" />
                                    <div className="prize-badge">{prize.rarity || 'Rare'}</div>
                                </div>
                                <div className="prize-details">
                                    <h3>{prize.theme}</h3>
                                    <p>#{prize.mintNumber || 'GEN-0'}</p>
                                </div>
                                <button className="forge-reset-btn" onClick={resetMachine}>
                                    Mint Another
                                </button>
                            </div>
                        )}
                    </div>

                    {!currentUser && (
                        <div className="auth-notice">
                            <AlertCircle size={16} /> <span>Sign in required to mint</span>
                        </div>
                    )}
                </div>

                {/* Right Panel: 3D Scene */}
                <div className="forge-3d-panel">
                    <div className="scene-wrapper-inset">
                        <BeeCrateScene appState={appState} />
                    </div>
                </div>
            </div>
        </section>
    );
}
