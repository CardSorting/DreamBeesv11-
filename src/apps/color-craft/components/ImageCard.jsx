import React from 'react';
import { Download, Trash2, Printer, Loader2, AlertCircle, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react';

const ImageCard = ({ image, onDelete }) => {
    const status = image.status || 'success';

    const handleDownload = () => {
        if (!image.url) return;
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `colorcraft-${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        if (!image.url) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>Print Coloring Page - ColorCraft AI</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
              @media print {
                body { -webkit-print-color-adjust: exact; }
                img { width: 100%; height: auto; }
              }
            </style>
          </head>
          <body>
            <img src="${image.url}" onload="window.print();window.close()" />
          </body>
        </html>
      `);
            printWindow.document.close();
        }
    };

    const renderStatusBadge = () => {
        switch (status) {
            case 'pending':
                return (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                        <Clock className="w-3 h-3" />
                        <span>Queued</span>
                    </div>
                );
            case 'generating':
                return (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                        <XCircle className="w-3 h-3" />
                        <span>Failed</span>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                    </div>
                );
            default:
                return null;
        }
    };

    const isPlaceholder = status !== 'success';

    return (
        <div className={`group relative bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full
        ${status === 'error' ? 'border-red-200' : 'border-slate-200'}
    `}>

            {/* Image / Placeholder Area */}
            <div className="aspect-[3/4] w-full bg-slate-50 relative overflow-hidden flex-shrink-0">
                {isPlaceholder ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        {status === 'pending' && <RefreshCw className="w-10 h-10 text-slate-300 mb-4 opacity-50" />}
                        {status === 'generating' && <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />}
                        {status === 'error' && <AlertCircle className="w-10 h-10 text-red-400 mb-4" />}

                        <p className="text-sm font-medium text-slate-700">
                            {status === 'pending' && 'Waiting in line...'}
                            {status === 'generating' && 'Drawing artwork...'}
                            {status === 'error' && 'Generation Failed'}
                        </p>
                        {status === 'error' && (
                            <p className="text-xs text-red-500 mt-2 line-clamp-3 bg-red-50 p-2 rounded-lg border border-red-100">
                                {image.errorMessage || "Unknown error"}
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        <img
                            src={image.url}
                            alt={image.prompt}
                            className="w-full h-full object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500"
                        />

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                            <div className="flex gap-2 scale-90 group-hover:scale-100 transition-all duration-300">
                                <button
                                    onClick={handlePrint}
                                    className="bg-white p-3 rounded-full text-slate-700 shadow-lg hover:text-indigo-600 hover:scale-110 transition-all"
                                    title="Print"
                                >
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="bg-indigo-600 p-3 rounded-full text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-110 transition-all"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Content Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex flex-col flex-grow">
                <div className="flex justify-between items-start gap-3 mb-4">
                    <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-relaxed" title={image.prompt}>
                        {image.prompt}
                    </p>
                    <button
                        onClick={() => onDelete(image.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1 flex-shrink-0 rounded-md hover:bg-slate-50"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="mt-auto flex items-center justify-between">
                    {renderStatusBadge()}
                    {status === 'success' && (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100/50 px-2 py-1 rounded-full">
                            #{image.id.slice(0, 4)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageCard;
