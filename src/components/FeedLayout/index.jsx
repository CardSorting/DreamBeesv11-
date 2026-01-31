import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import SEO from '../SEO';
import SuggestedPanel from '../SuggestedPanel';
import { useModel } from '../../contexts/ModelContext';
import './FeedLayout.css';

export default function FeedLayout({
    children,
    activeSidebarId,
    seoProps,
    focusImage,
    onCloseFocus,
    isTransitioning = false
}) {
    const navigate = useNavigate();
    const { availableModels } = useModel();

    return (
        <div className="feed-layout-wrapper">
            {/* Transition Overlay */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: '#09090b',
                    zIndex: 9999,
                    opacity: isTransitioning ? 1 : 0,
                    pointerEvents: isTransitioning ? 'all' : 'none',
                    transition: 'opacity 0.3s ease-in-out'
                }}
            />

            <SEO {...seoProps} />

            <Sidebar activeId={activeSidebarId} />

            {/* Mobile Header Placeholder if needed, or sidebar handles it */}
            <div className="mobile-feed-header">
                {/* Mobile header content usually handled inside specific page or Sidebar component logic
                    but we keep the container for spacing/bg */}
            </div>

            <main className="feed-main-content">
                {children}
            </main>

            {/* Focus Overlay Modal */}
            <AnimatePresence>
                {focusImage && (
                    <motion.div
                        className="focus-overlay-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCloseFocus}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 200,
                            background: 'rgba(0,0,0,0.9)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ position: 'relative', maxHeight: '90vh', maxWidth: '90vw' }}
                        >
                            <img
                                src={focusImage.imageUrl || focusImage.url}
                                alt={focusImage.prompt}
                                style={{ maxHeight: '85vh', maxWidth: '100%', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                            />
                            <div style={{ marginTop: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                                {focusImage.prompt}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SuggestedPanel
                availableModels={availableModels}
                setActiveFilter={() => navigate('/discovery')}
            />
        </div>
    );
}
