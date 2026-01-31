import React, { useState } from 'react';
import { useTwitch } from '../../hooks/useTwitch';
import BrowseLayout from './BrowseLayout';
import BrowseGrid from './BrowseGrid';

const Browse = () => {
    const { personas, loading } = useTwitch();
    const [activeTag, setActiveTag] = useState('All');

    // Filter Logic matches old implementation plus new tag system
    const filteredPersonas = activeTag === 'All'
        ? personas
        : personas.filter(p => p.category === activeTag || (p.tags && p.tags.includes(activeTag)));

    // Derive tags for the filter bar
    const tags = ['All', 'Just Chatting', 'Gaming', 'Creative', 'Music', 'IRL'];

    return (
        <BrowseLayout
            sidebarProps={{
                recommendedChannels: personas, // For now show all as recommended
                followedChannels: [] // Placeholder
            }}
        >
            <div className="browse-title-section">
                <h1 className="browse-title">Browse</h1>
                <div className="browse-tags">
                    {tags.map(tag => (
                        <button
                            key={tag}
                            className={`browse-tag ${activeTag === tag ? 'active' : ''}`}
                            onClick={() => setActiveTag(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <BrowseGrid items={filteredPersonas} loading={loading} />
        </BrowseLayout>
    );
};

export default Browse;
