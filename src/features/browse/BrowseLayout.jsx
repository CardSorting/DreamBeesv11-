import React from 'react';
import BrowseHeader from './BrowseHeader';
import BrowseSidebar from './BrowseSidebar';
import './Browse.css';

const BrowseLayout = ({ children, sidebarProps }) => {
    return (
        <div className="browse-container">
            <BrowseHeader />
            <div className="browse-content-wrapper">
                <BrowseSidebar {...sidebarProps} />
                <main className="browse-main">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default BrowseLayout;
