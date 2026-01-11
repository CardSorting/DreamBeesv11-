import React from 'react';

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    className = '',
    icon: Icon
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`slideshow-btn slideshow-btn-${variant} ${className}`}
        >
            <div className="btn-shine" />

            {Icon && <Icon className="w-5 h-5" />}
            <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
        </button>
    );
};
