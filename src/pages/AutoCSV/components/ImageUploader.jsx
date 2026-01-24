import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

export const ImageUploader = ({ onUpload, disabled }) => {
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (files.length > 0) onUpload(files);
    },
    [onUpload, disabled]
  );

  const handleChange = useCallback(
    (e) => {
      if (disabled || !e.target.files) return;
      const files = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (files.length > 0) onUpload(files);
    },
    [onUpload, disabled]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors duration-200 ease-in-out cursor-pointer group
        ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/50 bg-white shadow-sm'}`}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        id="file-upload"
        disabled={disabled}
      />
      <label htmlFor="file-upload" className={`cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform'}`}>
            <Upload size={32} />
          </div>
          <div className="space-y-1">
            <h3 className={`text-lg font-semibold font-inter ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
              Upload Product Images
            </h3>
            <p className="text-sm text-gray-500 font-inter">
              Drag & drop or click to select
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-inter font-medium">
            <ImageIcon size={14} />
            <span>Supports JPG, PNG, WEBP</span>
          </div>
        </div>
      </label>
    </div>
  );
};