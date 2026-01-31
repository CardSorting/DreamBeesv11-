import React from 'react';
import BrowseCard from './BrowseCard';

const BrowseGrid = ({ items = [], loading = false }) => {

    if (loading) {
        return <div style={{ color: '#fff', padding: '20px' }}>Loading channels...</div>;
    }

    if (items.length === 0) {
        return <div style={{ color: '#adadb8', padding: '20px' }}>No active channels found.</div>;
    }

    return (
        <div className="browse-grid">
            {items.map((item) => (
                <BrowseCard key={item.id} persona={item} />
            ))}
        </div>
    );
};

export default BrowseGrid;
