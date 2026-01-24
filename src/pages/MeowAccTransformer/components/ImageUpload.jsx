
import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';

export const ImageUpload = ({ onImageSelect, isLoading }) => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onImageSelect(e.dataTransfer.files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    };

    return (
        <div
            className={`relative group cursor-pointer transition-all duration-300 ease-in-out transform
        ${isDragging ? 'scale-[1.02] border-pink-400 bg-pink-50/50' : 'hover:scale-[1.01] hover:bg-white/40'}
        ${isLoading ? 'pointer-events-none opacity-50' : ''}
        border-4 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center h-80
        glass-panel
        ${isDragging ? 'border-pink-400' : 'border-purple-200'}
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            <div className={`p-6 rounded-full bg-gradient-to-tr from-pink-200 to-purple-200 mb-6 transition-transform duration-500 ${isDragging ? 'rotate-12 scale-110' : 'group-hover:rotate-6'}`}>
                <Upload className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>

            <h3 className="text-2xl font-display font-bold text-meow-text mb-2">
                Upload Image
            </h3>
            <p className="text-meow-text/70 font-sans mb-6 max-w-xs">
                Drag & drop your photo here, or click to browse. Let's make it MEOWACC!
            </p>

            <div className="flex gap-2 items-center text-sm font-bold text-pink-400 bg-white/70 px-4 py-2 rounded-full shadow-sm">
                <Sparkles size={16} />
                <span>Supports JPG, PNG</span>
                <ImageIcon size={16} />
            </div>
        </div>
    );
};
