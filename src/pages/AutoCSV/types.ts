export interface ProductData {
  id: string; // Internal ID for UI
  imagePreview: string; // Base64 or URL
  fileName: string; // Original filename for CSV import
  post_title: string;
  post_name: string; // slug
  post_status: 'publish' | 'draft';
  sku: string;
  regular_price: string;
  sale_price: string;
  stock_status: 'instock' | 'outofstock';
  weight: string;
  length: string;
  width: string;
  height: string;
  tax_product_cat: string;
  tax_product_tag: string;
  tax_product_brand: string;
  color_options: string; // "Red | Blue"
  size_options: string; // "S | M | L"
  description: string; // SEO friendly description
  short_description: string;
}

export interface ProcessingState {
  total: number;
  current: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  error?: string;
}

export enum GeminiModel {
  VISION = 'gemini-2.5-flash-image', // Good balance of speed and vision
}