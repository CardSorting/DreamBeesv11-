import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import '../pages/AppsHub.css';

const AppCard = memo(({ title, description, icon: Icon, path, tags = [], color = "violet", rating = "4.9", isCompact = false, previewImage }) => {
    // Map internal color names to playful hexes
    const colorMap = {
        violet: "#A78BFA",
        pink: "#F472B6",
        amber: "#FBBF24",
        mint: "#34D399",
        rose: "#FB7185",
        sky: "#38BDF8",
        indigo: "#818CF8",
        blue: "#60A5FA"
    };

    const accentColor = colorMap[color] || colorMap.violet;

    return (
        <Link
            to={path}
            className={`app-card ${isCompact ? 'compact' : ''} ${previewImage ? 'has-preview' : ''}`}
            style={{ '--card-accent': accentColor }}
        >
            {previewImage && !isCompact && (
                <div className="app-card-preview">
                    <img src={previewImage} alt={`${title} preview`} loading="lazy" />
                </div>
            )}

            <div className="app-card-content">
                <div className="app-icon-container">
                    <div className="app-icon-wrapper">
                        <Icon size={isCompact ? 20 : 28} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="app-info">
                    <h3 className="app-title">{title}</h3>
                    <div className="app-category">
                        {tags[0] || "Creative"}
                        {rating && (
                            <span className="app-rating">
                                {rating} <Star className="rating-star" size={10} fill="currentColor" />
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {!isCompact && (
                <>
                    <p className="app-description">
                        {description}
                    </p>

                    <div className="app-footer">
                        <button className="install-btn">Open</button>
                    </div>
                </>
            )}
        </Link>
    );
});

export default AppCard;
