import React, { useState } from 'react';
import { Edit2, Check, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

// Helper to validate price string (simple float validation)
const isValidPrice = (price) => {
  if (!price) return true; // Allow empty, user might fill later
  // Matches "10", "10.5", "10.99"
  return /^\d+(\.\d{0,2})?$/.test(price);
};

export const ProductCard = ({ product, onUpdate, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper for simple text inputs
  const handleChange = (key, value) => {
    onUpdate(product.id, { [key]: value });
  };

  const isRegularPriceValid = isValidPrice(product.regular_price);
  const isSalePriceValid = isValidPrice(product.sale_price);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-center p-4 gap-4">
        {/* Thumbnail */}
        <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          <img src={product.imagePreview} alt={product.post_title} className="h-full w-full object-cover" />
        </div>

        {/* Main Info */}
        <div className="flex-grow min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 font-inter">Product Title</label>
            <input
              type="text"
              value={product.post_title}
              onChange={(e) => handleChange('post_title', e.target.value)}
              className="w-full text-sm font-medium text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none bg-transparent font-inter"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 font-inter">SKU</label>
            <input
              type="text"
              value={product.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              className="w-full text-sm text-gray-600 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none bg-transparent font-inter"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 font-inter">Category</label>
            <input
              type="text"
              value={product.tax_product_cat}
              onChange={(e) => handleChange('tax_product_cat', e.target.value)}
              className="w-full text-sm text-gray-600 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none bg-transparent font-inter"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <button
            onClick={() => onRemove(product.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 bg-gray-50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 font-inter">SEO Description</label>
              <textarea
                value={product.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border font-inter"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 font-inter">Short Description</label>
              <textarea
                value={product.short_description}
                onChange={(e) => handleChange('short_description', e.target.value)}
                rows={2}
                className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border font-inter"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 font-inter">Regular Price</label>
                <div className="relative">
                  <input
                    type="text"
                    value={product.regular_price}
                    onChange={(e) => handleChange('regular_price', e.target.value)}
                    className={`w-full text-sm rounded-lg shadow-sm p-2 border font-inter ${isRegularPriceValid
                        ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        : 'border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900 pr-10'
                      }`}
                    placeholder="0.00"
                  />
                  {!isRegularPriceValid && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {!isRegularPriceValid && <p className="mt-1 text-xs text-red-500 font-inter">Invalid price format</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 font-inter">Sale Price</label>
                <div className="relative">
                  <input
                    type="text"
                    value={product.sale_price}
                    onChange={(e) => handleChange('sale_price', e.target.value)}
                    className={`w-full text-sm rounded-lg shadow-sm p-2 border font-inter ${isSalePriceValid
                        ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        : 'border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900 pr-10'
                      }`}
                    placeholder="0.00"
                  />
                  {!isSalePriceValid && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {!isSalePriceValid && <p className="mt-1 text-xs text-red-500 font-inter">Invalid price format</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 font-inter">Colors (Pipe separated)</label>
                <input
                  type="text"
                  value={product.color_options}
                  onChange={(e) => handleChange('color_options', e.target.value)}
                  placeholder="Red | Blue"
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border font-inter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 font-inter">Sizes (Pipe separated)</label>
                <input
                  type="text"
                  value={product.size_options}
                  onChange={(e) => handleChange('size_options', e.target.value)}
                  placeholder="S | M | L"
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border font-inter"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 font-inter">Tags</label>
              <input
                type="text"
                value={product.tax_product_tag}
                onChange={(e) => handleChange('tax_product_tag', e.target.value)}
                className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border font-inter"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};