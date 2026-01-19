import React from 'react';
import '../MockupStudio.css';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "ms-btn";

    const variants = {
        primary: "ms-btn-primary",
        secondary: "ms-btn-secondary",
        outline: "ms-btn-outline"
    };

    return (
        <button
            className={`${baseStyle} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
