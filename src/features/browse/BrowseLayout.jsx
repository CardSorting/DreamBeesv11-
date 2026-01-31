import React from 'react';
import MinimalHeader from '../../components/MinimalHeader';
import BrowseSidebar from './BrowseSidebar';
import './Browse.css';

const BrowseLayout = ({ children, sidebarProps }) => {
    return (
        <div className="browse-container">
            <MinimalHeader />
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
