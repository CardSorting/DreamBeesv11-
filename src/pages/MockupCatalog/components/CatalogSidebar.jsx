import React, { useState, useEffect } from 'react';
import { CATEGORY_MAPPING } from '../categoryData';
import * as Icons from 'lucide-react';

const CatalogSidebar = ({ activeParent, activeChild, onNavigate }) => {
    // Local state for expanded sections
    // Default: expand the active parent if exists, else expand all or none?
    // Let's expand just the active one by default.
    const [expanded, setExpanded] = useState({});

    // Sync with props: if activeParent changes, ensure it is expanded
    // Sync with props: if activeParent changes, ensure it is expanded
    useEffect(() => {
        if (activeParent) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setExpanded(prev => {
                if (prev[activeParent]) return prev;
                return { ...prev, [activeParent]: true };
            });
        }
    }, [activeParent]);

    const toggleExpand = (parentName) => {
        setExpanded(prev => ({
            ...prev,
            [parentName]: !prev[parentName]
        }));
    };

    const handleParentClick = (parentName) => {
        // If already active, just toggle. If not, navigate AND expand.
        if (activeParent === parentName) {
            toggleExpand(parentName);
        } else {
            // Navigate to parent (which also sets activeParent -> triggers effect -> expands)
            // But we want to toggle if clicked specifically on the arrow? 
            // Common UX: clicking header navigates + expands. 
            // Clicking arrow just toggles.
            // Let's assume clicking header does both.
            onNavigate(parentName);
        }
    };

    return (
        <aside className="mc-sidebar custom-scrollbar">
            <h3 className="mc-sidebar-title">Categories</h3>
            <div className="mc-sidebar-menu">
                {Object.entries(CATEGORY_MAPPING).map(([parentName, data]) => {
                    const Icon = Icons[data.icon] || Icons.Box;
                    const isActive = activeParent === parentName;
                    const isExpanded = expanded[parentName];

                    return (
                        <div key={parentName} className={`mc-sidebar-group ${isActive ? 'active' : ''}`}>
                            <div
                                className="mc-sidebar-parent"
                                onClick={() => handleParentClick(parentName)}
                            >
                                <Icon size={18} />
                                <span>{parentName}</span>

                                <div
                                    className="mc-chevron-wrapper"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(parentName);
                                    }}
                                >
                                    <Icons.ChevronDown
                                        size={16}
                                        className={`mc-chevron ${isExpanded ? 'rotated' : ''}`}
                                    />
                                </div>
                            </div>

                            {/* Animated Height Transition could go here, but simple conditional for now */}
                            {isExpanded && (
                                <div className="mc-sidebar-children animate-slide-down">
                                    {data.children.map(child => (
                                        <div
                                            key={child}
                                            className={`mc-sidebar-child ${activeChild === child ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onNavigate(parentName, child);
                                            }}
                                        >
                                            {child}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Disclaimer or Footer in Sidebar */}
            <div className="mc-sidebar-footer">
                <p>© 2026 DreamBees</p>
            </div>
        </aside>
    );
};

export default CatalogSidebar;
