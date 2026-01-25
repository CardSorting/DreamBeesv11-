import React, { useState } from 'react';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, ImageRun, PageBreak, AlignmentType } from 'docx';

const JsonExportModal = ({ isOpen, onClose, images }) => {
    const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

    if (!isOpen) return null;

    const validImages = images.filter(img => img.status === 'success' && img.url);

    // --- DOCX Logic ---
    const handleDownloadDocx = async () => {
        setIsGeneratingDoc(true);
        try {
            const children = [];

            // 1. Title Page
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "My Coloring Book",
                            bold: true,
                            size: 72, // 36pt
                            font: "Arial",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 4000, after: 400 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Created with ColorCraft AI`,
                            size: 32,
                            font: "Arial",
                            color: "666666"
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: new Date().toLocaleDateString(),
                            size: 24,
                            font: "Arial",
                            color: "999999"
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    children: [new PageBreak()],
                })
            );

            // 2. Image Pages
            for (const img of validImages) {
                if (img.url) {
                    // Fetch image buffer
                    try {
                        // If local Blob URL, fetch it. If remote URL, ensure CORS or use Proxy?
                        // Since backend returns "B2_PUBLIC_URL", it should be public. 
                        // However, `docx` needs ArrayBuffer.
                        const response = await fetch(img.url);
                        if (!response.ok) throw new Error("Failed to fetch image");
                        const blob = await response.blob();
                        const buffer = await blob.arrayBuffer();

                        children.push(
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: buffer,
                                        transformation: {
                                            width: 500, // Approx width of A4 minus margins
                                            height: 600, // Maintain aspect ratio roughly
                                        },
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 400, after: 400 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: img.prompt,
                                        size: 20,
                                        color: "999999",
                                        italics: true,
                                        font: "Arial"
                                    })
                                ],
                                alignment: AlignmentType.CENTER,
                            }),
                            new Paragraph({
                                children: [new PageBreak()],
                            })
                        );
                    } catch (e) {
                        console.error("Skipping image due to fetch error", e);
                    }
                }
            }

            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: children,
                    },
                ],
            });

            const blob = await Packer.toBlob(doc);

            // Trigger Download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = "My-Coloring-Book.docx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (e) {
            console.error("Failed to generate DOCX", e);
            alert("Failed to generate document. Please try again.");
        } finally {
            setIsGeneratingDoc(false);
        }
    };

    return (
        <div className="cc-modal-overlay">
            {/* Backdrop */}
            <div
                className="cc-modal-backdrop"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="cc-modal-content" style={{ maxWidth: '32rem' }}>

                {/* Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
                    <div>
                        <h3 style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.125rem' }}>Export Coloring Book</h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Download your pages as a printable document</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ color: '#94a3b8', padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s' }}
                    >
                        <X style={{ width: '1.25rem', height: '1.25rem' }} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.5rem', backgroundColor: 'white' }}>
                    <div style={{ width: '5rem', height: '5rem', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText style={{ width: '2.5rem', height: '2.5rem' }} />
                    </div>
                    <div style={{ maxWidth: '24rem' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>Printable Word Document</h4>
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                            Generates a Microsoft Word (.docx) file with a title page and one image per page, formatted for A4 paper.
                        </p>
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9' }}>
                            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pages included:</span> <span style={{ fontWeight: '600', color: '#475569' }}>{validImages.length}</span></p>
                            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Format:</span> <span style={{ fontWeight: '600', color: '#475569' }}>A4 Portrait</span></p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', backgroundColor: 'white', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                        onClick={onClose}
                        className="cc-btn cc-btn-white"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleDownloadDocx}
                        disabled={isGeneratingDoc || validImages.length === 0}
                        className="cc-btn cc-btn-primary"
                        style={{
                            opacity: (isGeneratingDoc || validImages.length === 0) ? 0.5 : 1,
                            cursor: (isGeneratingDoc || validImages.length === 0) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isGeneratingDoc ? (
                            <>
                                <Loader2 className="cc-animate-spin" style={{ width: '1rem', height: '1rem' }} />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download style={{ width: '1rem', height: '1rem' }} />
                                Download Book
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JsonExportModal;
