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
                    <div className="cc-badge cc-badge-pending">
                        <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
                        <span>Queued</span>
                    </div>
                );
            case 'generating':
                return (
                    <div className="cc-badge cc-badge-generating">
                        <Loader2 className="cc-animate-spin" style={{ width: '0.75rem', height: '0.75rem' }} />
                        <span>Generating</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="cc-badge cc-badge-error">
                        <XCircle style={{ width: '0.75rem', height: '0.75rem' }} />
                        <span>Failed</span>
                    </div>
                );
            case 'success':
                return (
                    <div className="cc-badge cc-badge-success">
                        <CheckCircle2 style={{ width: '0.75rem', height: '0.75rem' }} />
                        <span>Ready</span>
                    </div>
                );
            default:
                return null;
        }
    };

    const isPlaceholder = status !== 'success';

    return (
        <div className={`cc-image-card ${status === 'error' ? 'error' : ''}`}>

            {/* Image / Placeholder Area */}
            <div className="cc-image-container">
                {isPlaceholder ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
                        {status === 'pending' && <RefreshCw style={{ width: '2.5rem', height: '2.5rem', color: '#cbd5e1', marginBottom: '1rem', opacity: 0.5 }} />}
                        {status === 'generating' && <Loader2 className="cc-animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#6366f1', marginBottom: '1rem' }} />}
                        {status === 'error' && <AlertCircle style={{ width: '2.5rem', height: '2.5rem', color: '#f87171', marginBottom: '1rem' }} />}

                        <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>
                            {status === 'pending' && 'Waiting in line...'}
                            {status === 'generating' && 'Drawing artwork...'}
                            {status === 'error' && 'Generation Failed'}
                        </p>
                        {status === 'error' && (
                            <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                                {image.errorMessage || "Unknown error"}
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        <img
                            src={image.url}
                            alt={image.prompt}
                        />

                        {/* Overlay Actions */}
                        <div className="cc-card-overlay">
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={handlePrint}
                                    style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '50%', color: '#334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    title="Print"
                                >
                                    <Printer style={{ width: '1.25rem', height: '1.25rem' }} />
                                </button>
                                <button
                                    onClick={handleDownload}
                                    style={{ backgroundColor: '#4f46e5', padding: '0.75rem', borderRadius: '50%', color: 'white', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
                                    title="Download"
                                >
                                    <Download style={{ width: '1.25rem', height: '1.25rem' }} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Content Footer */}
            <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', backgroundColor: 'white', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0f172a', lineHeight: '1.625' }} title={image.prompt}>
                        {image.prompt}
                    </p>
                    <button
                        onClick={() => onDelete(image.id)}
                        style={{ color: '#cbd5e1', padding: '0.25rem', borderRadius: '0.375rem', transition: 'color 0.2s' }}
                        title="Delete"
                    >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    </button>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {renderStatusBadge()}
                    {status === 'success' && (
                        <span style={{ fontSize: '10px', fontWeight: '500', color: '#94a3b8', backgroundColor: 'rgba(241, 245, 249, 0.5)', padding: '0.25rem 0.5rem', borderRadius: '9999px' }}>
                            #{image.id.slice(0, 4)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageCard;
