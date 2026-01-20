import React from 'react';
import * as Icons from 'lucide-react';

const CategoryGrid = ({ categories, onSelect }) => {
    return (
        <div className="mc-grid">
            {categories.map((cat, idx) => {
                const IconComponent = Icons[cat.icon] || Icons.Box;

                return (
                    <div
                        key={cat.id || cat.name}
                        className="mc-category-card animate-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                        onClick={() => onSelect(cat)}
                    >
                        <div className="mc-cat-icon">
                            <IconComponent size={32} />
                        </div>
                        <div className="mc-cat-title">{cat.name}</div>
                        {cat.description && (
                            <div className="mc-cat-desc">{cat.description}</div>
                        )}
                        {cat.count !== undefined && (
                            <div className="mc-cat-count">{cat.count} items</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CategoryGrid;
