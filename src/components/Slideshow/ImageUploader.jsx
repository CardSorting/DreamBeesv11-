import React from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

export const ImageUploader = ({ onImageSelect, selectedImage }) => {
    const [isDragging, setIsDragging] = React.useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            onImageSelect(file, previewUrl);
        }
    };

    const handleClear = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onImageSelect(null, null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const previewUrl = URL.createObjectURL(file);
            onImageSelect(file, previewUrl);
        } else if (file) {
            alert("Please upload an image file");
        }
    };

    return (
        <div className="uploader-container">
            <div
                className={`uploader-box ${selectedImage ? 'has-image' : ''} ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >

                {!selectedImage && (
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                    />
                )}

                {selectedImage ? (
                    <div className="preview-wrapper">
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="preview-image"
                        />
                        <button className="clear-image-btn" onClick={handleClear}>
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="placeholder-content">
                        <div className={`placeholder-icon ${isDragging ? 'scale-110 bg-brand-100 text-brand-500' : ''}`}>
                            <Upload size={32} />
                        </div>
                        <h3 className="placeholder-title">
                            {isDragging ? "Drop it like it's hot!" : "Upload an image"}
                        </h3>
                        <p className="placeholder-subtitle">
                            {isDragging ? "Release to upload" : "Click to browse or drag and drop"}
                        </p>
                        <div className="format-badge">
                            <ImageIcon size={12} /> Supports JPG, PNG, WebP
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
