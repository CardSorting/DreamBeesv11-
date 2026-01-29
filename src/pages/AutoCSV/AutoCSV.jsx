import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { ImageUploader } from './components/ImageUploader';
import { ProductCard } from './components/ProductCard';
import { analyzeProductImage } from '../../services/ecommerceService';
import { useUserInteractions } from '../../contexts/UserInteractionsContext';
import { WOOCOMMERCE_HEADERS, WOOCOMMERCE_HEADER_STRING, SHOPIFY_HEADERS, SHOPIFY_HEADER_STRING } from './constants';
import { processImageForGemini } from './utils/imageUtils';
import { FileDown, Sparkles, AlertCircle, Loader2, Trash2, Layers, Package, Settings, Info, Globe, ShoppingBag, Store, Clock, Zap } from 'lucide-react';
import { ZAP_COSTS, formatZaps } from '../../constants/zapCosts';
import toast from 'react-hot-toast';

export default function AutoCSV() {
  const [products, setProducts] = useState([]);
  const [processingState, setProcessingState] = useState({
    total: 0,
    current: 0,
    status: 'idle',
    isCooling: false,
  });

  // Platform selection state
  const [platform, setPlatform] = useState('woocommerce');

  // Store Domain State - User just enters the main site URL
  const [storeDomain, setStoreDomain] = useState('https://meowacc.com');

  const [isPackaging, setIsPackaging] = useState(false);

  // Queue state
  const [queue, setQueue] = useState([]);
  const processingRef = useRef(false);

  const { userProfile, deductZapsOptimistically } = useUserInteractions();
  const COST_PER_IMAGE = ZAP_COSTS.AUTO_CSV_IMAGE;
  const totalBatchCost = queue.length * COST_PER_IMAGE;
  const hasEnoughZaps = userProfile.zaps >= COST_PER_IMAGE; // Basic check for next item
  const hasEnoughZapsForBatch = userProfile.zaps >= totalBatchCost;

  // Queue Processor
  useEffect(() => {
    const processNextItem = async () => {
      // Guard: If already processing or queue empty, do nothing
      if (processingRef.current || queue.length === 0) {
        // Check if we just finished a batch
        if (queue.length === 0 && processingState.status === 'processing' && !processingRef.current) {
          setProcessingState(prev => ({ ...prev, status: 'completed' }));
          // Reset to idle after a delay
          setTimeout(() => {
            setProcessingState(prev => {
              // Only reset if still completed (user hasn't started new batch)
              return prev.status === 'completed' ? { ...prev, status: 'idle' } : prev;
            });
          }, 2000);
        }
        return;
      }

      processingRef.current = true;
      const file = queue[0];

      // High-Reliability Buffer Strategy: Prevent rate-limiting and ensure server stability
      if (processingState.current > 0) {
        const baseDelay = 1200; // 1.2s base
        const jitter = Math.random() * 800; // 0-800ms jitter

        // Burst Protection: Pause every 5 images
        const isBurstBreak = processingState.current % 5 === 0;
        const burstDelay = isBurstBreak ? 1500 : 0;

        // Scaling Cooldown: Add 500ms for every 15 images processed
        const scalingCooldown = Math.floor(processingState.current / 15) * 500;

        const totalDelay = baseDelay + jitter + burstDelay + scalingCooldown;

        if (totalDelay > 2000) {
          setProcessingState(prev => ({ ...prev, isCooling: true }));
        }

        await new Promise(resolve => setTimeout(resolve, totalDelay));
        setProcessingState(prev => ({ ...prev, isCooling: false }));
      }

      try {
        // Create a local preview URL for the UI immediately
        const previewUrl = URL.createObjectURL(file);

        // Process and optimize image for API (Resize & Compress)
        const { base64, mimeType } = await processImageForGemini(file);

        // Call Vertex AI via DreamBees Backend
        const partialData = await analyzeProductImage(base64, mimeType);

        const newProduct = {
          id: crypto.randomUUID(),
          imagePreview: previewUrl,
          fileName: file.name, // Store original filename for reference
          post_title: partialData.post_title || 'Untitled Product',
          post_name: partialData.post_name || 'untitled-product',
          post_status: 'publish',
          sku: partialData.sku || `SKU-${Date.now()}`,
          regular_price: partialData.regular_price || '',
          sale_price: partialData.sale_price || '',
          stock_status: 'instock',
          weight: partialData.weight || '',
          length: partialData.length || '',
          width: partialData.width || '',
          height: partialData.height || '',
          tax_product_cat: partialData.tax_product_cat || 'Uncategorized',
          tax_product_tag: partialData.tax_product_tag || '',
          tax_product_brand: partialData.tax_product_brand || '',
          color_options: partialData.color_options || '',
          size_options: partialData.size_options || '',
          description: partialData.description || '',
          short_description: partialData.short_description || '',
        };

        setProducts((prev) => [...prev, newProduct]);

        // Update progress
        setProcessingState(prev => ({ ...prev, current: prev.current + 1 }));

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // We still increment processed count to keep progress bar moving
        setProcessingState(prev => ({ ...prev, current: prev.current + 1 }));
      } finally {
        // Remove processed item from queue
        setQueue(prev => prev.slice(1));
        processingRef.current = false;
      }
    };

    processNextItem();
  }, [queue, processingState]);

  const handleUpload = useCallback((files) => {
    const costForNewFiles = files.length * ZAP_COSTS.AUTO_CSV_IMAGE;

    if (userProfile.zaps < costForNewFiles) {
      toast.error(`Insufficient Zaps! You need at least ${formatZaps(costForNewFiles)} Zaps.`);
      return;
    }

    if (deductZapsOptimistically) deductZapsOptimistically(costForNewFiles);

    setProcessingState(prev => {
      const isNewBatch = prev.status === 'idle' || prev.status === 'completed';
      return {
        total: isNewBatch ? files.length : prev.total + files.length,
        current: isNewBatch ? 0 : prev.current,
        status: 'processing'
      };
    });
    setQueue(prev => [...prev, ...files]);
  }, [userProfile.zaps, deductZapsOptimistically]);

  const handleUpdateProduct = useCallback((id, data) => {
    setProducts((prev) => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const handleRemoveProduct = useCallback((id) => {
    setProducts((prev) => prev.filter(p => p.id !== id));
  }, []);

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all generated data?")) {
      setProducts([]);
    }
  }

  // Calculate current date path components once
  const getCurrentDatePath = () => {
    if (platform === 'shopify') {
      return ''; // Shopify doesn't have a standard predictable date folder by default unless set up manually
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `/wp-content/uploads/${year}/${month}`;
  };

  // Helper to normalize domain input (add protocol, remove trailing slash)
  const getFormattedBaseUrl = (domain) => {
    let url = domain.trim();
    if (!url) return '';
    // Add protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    // Remove trailing slash
    return url.replace(/\/$/, '');
  };

  const generatePackage = async () => {
    if (products.length === 0) return;
    setIsPackaging(true);

    try {
      const zip = new JSZip();
      const imgFolder = zip.folder("images");

      const uploadPath = getCurrentDatePath();
      const normalizedDomain = getFormattedBaseUrl(storeDomain);

      // We need to fetch the blobs from the object URLs to zip them
      // We also rename them to match the SEO friendly slug
      const processedRows = await Promise.all(products.map(async (p) => {
        // 1. Determine new filename based on slug
        const extension = p.fileName.split('.').pop() || 'jpg';
        const cleanSlug = p.post_name.replace(/[^a-z0-9-]/g, '-').toLowerCase();
        const newFileName = `${cleanSlug}.${extension}`;

        // 2. Add image to zip
        try {
          const response = await fetch(p.imagePreview);
          const blob = await response.blob();
          if (imgFolder) {
            imgFolder.file(newFileName, blob);
          }
        } catch (e) {
          console.error(`Failed to pack image for ${p.post_title}`, e);
        }

        // 3. Construct URL for CSV
        let finalUrl = newFileName;
        if (normalizedDomain) {
          // For WooCommerce: normalizedDomain + /wp-content/.../ + filename
          // For Shopify: normalizedDomain + / + filename
          // uploadPath comes with leading slash for Woo, empty for Shopify
          finalUrl = `${normalizedDomain}${uploadPath}/${newFileName}`;
        }

        // 4. Return row data
        return {
          ...p,
          finalImageValue: finalUrl
        };
      }));

      // Generate CSV content
      let csvContent = '';

      if (platform === 'woocommerce') {
        const rows = processedRows.map(p => {
          const rowData = {
            post_title: p.post_title,
            post_name: p.post_name,
            post_status: p.post_status,
            sku: p.sku,
            images: p.finalImageValue,
            post_content: p.description,
            post_excerpt: p.short_description,
            downloadable: 'no',
            virtual: 'no',
            visibility: 'visible',
            stock: '',
            stock_status: p.stock_status,
            backorders: 'no',
            manage_stock: 'no',
            regular_price: p.regular_price,
            sale_price: p.sale_price,
            weight: p.weight,
            length: p.length,
            width: p.width,
            height: p.height,
            tax_status: 'taxable',
            tax_class: '',
            'tax:product_type': (p.color_options || p.size_options) ? 'variable' : 'simple',
            'tax:product_cat': p.tax_product_cat,
            'tax:product_tag': p.tax_product_tag,
            'tax:product_brand': p.tax_product_brand,
            'attribute:Color': p.color_options ? 'Color' : '',
            'attribute_data:Color': p.color_options ? `0|1|1` : '',
            'attribute:Size': p.size_options ? 'Size' : '',
            'attribute_data:Size': p.size_options ? `0|1|1` : '',
          };

          return WOOCOMMERCE_HEADERS.map(header => {
            let val = rowData[header] || '';
            if (header === 'attribute:Color') return p.color_options;
            if (header === 'attribute:Size') return p.size_options;
            if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
              val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          }).join(',');
        });
        csvContent = [WOOCOMMERCE_HEADER_STRING, ...rows].join('\n');

      } else {
        // Shopify Mapping
        const rows = processedRows.map(p => {
          // Logic for prices: Shopify 'Price' is the selling price. 'Compare At' is the original price.
          const variantPrice = p.sale_price || p.regular_price;
          const compareAtPrice = p.sale_price ? p.regular_price : '';

          const rowData = {
            'Handle': p.post_name,
            'Title': p.post_title,
            'Body (HTML)': p.description,
            'Vendor': p.tax_product_brand || 'Generic',
            'Standard Product Type': '',
            'Custom Product Type': p.tax_product_cat,
            'Tags': p.tax_product_tag,
            'Published': 'TRUE',
            'Option1 Name': p.color_options ? 'Color' : (p.size_options ? 'Size' : 'Title'),
            'Option1 Value': p.color_options || p.size_options || 'Default Title',
            'Option2 Name': (p.color_options && p.size_options) ? 'Size' : '',
            'Option2 Value': (p.color_options && p.size_options) ? p.size_options : '',
            'Option3 Name': '',
            'Option3 Value': '',
            'Variant SKU': p.sku,
            'Variant Grams': p.weight, // Note: Need to ensure this is grams if possible, but passing raw for now
            'Variant Inventory Tracker': 'shopify',
            'Variant Inventory Qty': '100', // Default stock
            'Variant Inventory Policy': 'deny',
            'Variant Fulfillment Service': 'manual',
            'Variant Price': variantPrice,
            'Variant Compare At Price': compareAtPrice,
            'Variant Requires Shipping': 'TRUE',
            'Variant Taxable': 'TRUE',
            'Variant Barcode': '',
            'Image Src': p.finalImageValue,
            'Image Position': '1',
            'Image Alt Text': p.post_title,
            'Gift Card': 'FALSE',
            'SEO Title': p.post_title,
            'SEO Description': p.short_description,
            'Status': 'active'
          };

          return SHOPIFY_HEADERS.map(header => {
            let val = rowData[header] || '';
            if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
              val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          }).join(',');
        });
        csvContent = [SHOPIFY_HEADER_STRING, ...rows].join('\n');
      }

      zip.file("products.csv", csvContent);

      // Generate and download zip
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `autocsv_${platform}_export_${new Date().toISOString().slice(0, 10)}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Failed to generate zip", err);
      alert("Failed to generate zip file.");
    } finally {
      setIsPackaging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 pt-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header UI manually integrated since we are in a sub-page */}
        <div className="bg-white border-b border-gray-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-PURPLE">
              AutoCSV <span className="text-gray-400 font-normal text-sm ml-2 font-inter">Powered by DreamBees Vertex (Gemini 2.5 Flash)</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {products.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                Clear
              </button>
            )}
            <button
              onClick={generatePackage}
              disabled={products.length === 0 || (processingState.status === 'processing' && queue.length > 0) || isPackaging}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm
                ${products.length > 0 && !isPackaging && !(processingState.status === 'processing' && queue.length > 0)
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isPackaging ? <Loader2 className="animate-spin" size={18} /> : <Package size={18} />}
              {isPackaging ? 'Zipping...' : `Download ${platform === 'woocommerce' ? 'Woo' : 'Shopify'} ZIP`}
            </button>
          </div>
        </div>

        {/* Intro / Empty State */}
        {products.length === 0 && processingState.status === 'idle' && (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 font-inter">Populate your store in seconds</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 font-inter">
              Upload product photos. We'll use AI to identify the item, write SEO-friendly descriptions,
              estimate prices, and format everything for a one-click CSV import.
            </p>
          </div>
        )}

        {/* Uploader */}
        <div className="max-w-3xl mx-auto">
          <ImageUploader
            onUpload={handleUpload}
            disabled={false} // Always allow uploading to queue
          />
        </div>

        {/* Configuration Panel (Only visible when items exist) */}
        {products.length > 0 && (
          <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Platform Selection Header */}
            <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-700">
                  <Settings size={18} />
                </div>
                <span className="font-semibold text-gray-900 text-sm font-inter">Export Settings</span>
              </div>

              <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                <button
                  onClick={() => setPlatform('woocommerce')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all
                      ${platform === 'woocommerce' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Store size={14} />
                  WooCommerce
                </button>
                <button
                  onClick={() => setPlatform('shopify')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all
                      ${platform === 'shopify' ? 'bg-green-50 text-green-700 shadow-sm border border-green-100' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <ShoppingBag size={14} />
                  Shopify
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col md:flex-row gap-6 items-start">
              <div className="flex items-center gap-3 md:w-1/3">
                <div className="bg-blue-50 p-2 rounded-md text-blue-600 flex-shrink-0">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 font-inter">Image Base URL</h3>
                  <p className="text-xs text-gray-500 font-inter">
                    {platform === 'woocommerce'
                      ? "Enter your WordPress domain."
                      : "Enter the base URL for images."}
                  </p>
                </div>
              </div>

              <div className="flex-grow w-full md:w-2/3">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder={platform === 'woocommerce' ? "https://yourstore.com" : "https://yourstore.com/images"}
                    value={storeDomain}
                    onChange={(e) => setStoreDomain(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-inter"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-help" title="Enter the URL where these images will be hosted.">
                    <Info size={16} />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 font-mono break-all">
                  <span className="font-semibold text-gray-400 select-none">Example Link: </span>
                  <span className="text-indigo-600">
                    {(() => {
                      const base = getFormattedBaseUrl(storeDomain) || (platform === 'woocommerce' ? 'https://yourstore.com' : 'https://yourstore.com/images');
                      const path = getCurrentDatePath();
                      return `${base}${path}/product-slug.jpg`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar & Queue Status */}
        {processingState.status === 'processing' && (
          <div className="max-w-xl mx-auto bg-white rounded-xl p-6 shadow-sm border border-indigo-100 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-indigo-900 flex items-center gap-2 font-inter">
                {processingState.isCooling ? <Clock className="animate-pulse text-indigo-400" size={16} /> : <Loader2 className="animate-spin" size={16} />}
                {processingState.isCooling
                  ? 'Cooling down...'
                  : (queue.length > 0 ? 'Analyzing with Vertex AI...' : 'Finalizing...')}
              </span>
              <div className="text-right">
                <span className="text-sm font-medium text-indigo-600 font-inter">
                  {processingState.current} / {processingState.total}
                </span>
                {totalBatchCost > 0 && (
                  <div className="text-[10px] text-gray-400 font-inter">
                    Remaining Batch Cost: {formatZaps(queue.length * COST_PER_IMAGE)} Zaps
                  </div>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(processingState.current / processingState.total) * 100}%` }}
              />
            </div>
            {!hasEnoughZaps && queue.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-md flex items-center gap-2 text-red-600 text-xs font-inter animate-pulse">
                <AlertCircle size={14} />
                Insufficient Zaps to process remaining images.
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-400 font-inter">
                Generating titles, prices, and SEO descriptions.
              </p>
              {queue.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-indigo-500 font-medium bg-indigo-50 px-2 py-1 rounded-full font-inter">
                  <Layers size={12} />
                  {queue.length} in queue
                </div>
              )}
            </div>
          </div>
        )}

        {/* Batch Info (When idle but queue has items or just uploaded) */}
        {queue.length > 0 && processingState.status === 'idle' && (
          <div className="max-w-xl mx-auto bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <Zap size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900 font-inter">Ready to process {queue.length} images</p>
                <p className="text-xs text-indigo-600 font-inter">Total Cost: {formatZaps(totalBatchCost)} Zaps ({formatZaps(userProfile?.zaps || 0)} available)</p>
              </div>
            </div>
            {!hasEnoughZapsForBatch && (
              <div className="flex items-center gap-1 text-red-600 text-xs font-bold bg-white px-2 py-1 rounded-md border border-red-100">
                <AlertCircle size={14} />
                Low Zaps
              </div>
            )}
          </div>
        )}

        {/* Product List */}
        {products.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 font-inter">
                Generated Products ({products.length})
              </h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-inter">
                Review and edit before downloading package
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onUpdate={handleUpdateProduct}
                  onRemove={handleRemoveProduct}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm font-inter">
        <p>AutoCSV &copy; {new Date().getFullYear()}. Privacy: Images are processed by DreamBees Backend and not stored.</p>
      </footer>
    </div>
  );
}