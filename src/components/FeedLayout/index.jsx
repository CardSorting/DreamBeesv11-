import React from 'react';
import Sidebar from '../Sidebar';
import SEO from '../SEO';
import SuggestedPanel from '../SuggestedPanel';
import '../../styles/Feeds.css';

export default function FeedLayout({
    children,
    activeSidebarId,
    seoProps,
    suggestedPanelProps,
    showcaseModal = null
}) {
    return (
        <div className="feed-layout-wrapper">
            <SEO {...seoProps} />

            <Sidebar activeId={activeSidebarId} />

            <main className="feed-main-content">
                {children}
            </main>

            <SuggestedPanel {...suggestedPanelProps} />

            {showcaseModal}
        </div>
    );
}
