import React from 'react';
import * as Icons from 'lucide-react';

const ItemGrid = ({ items, onSelect }) => {
    return (
        <div className="mc-grid">
            {items.map((item, idx) => {
                const IconComponent = Icons[item.iconName] || Icons.Image;

                return (
                    <div
                        key={item.id}
                        className="mc-item-card animate-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                        onClick={() => onSelect(item)}
                    >
                        <div className="mc-item-preview">
                            <IconComponent size={48} color="var(--text-secondary)" />

                            {/* Hover Overlay */}
                            <div className="mc-item-overlay">
                                <button className="mc-item-btn">Customize</button>
                            </div>
                        </div>
                        <div className="mc-item-info">
                            <div className="mc-item-title">{item.label}</div>
                            <div className="mc-item-tech">{item.formatSpec}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ItemGrid;
