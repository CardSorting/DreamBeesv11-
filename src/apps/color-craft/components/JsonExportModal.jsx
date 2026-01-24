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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Export Coloring Book</h3>
                        <p className="text-xs text-slate-500">Download your pages as a printable document</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-grow flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <FileText className="w-10 h-10" />
                    </div>
                    <div className="max-w-sm">
                        <h4 className="text-lg font-semibold text-slate-800 mb-2">Printable Word Document</h4>
                        <p className="text-slate-500 text-sm">
                            Generates a Microsoft Word (.docx) file with a title page and one image per page, formatted for A4 paper.
                        </p>
                        <div className="mt-6 flex flex-col gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="flex justify-between"><span>Pages included:</span> <span className="font-semibold text-slate-600">{validImages.length}</span></p>
                            <p className="flex justify-between"><span>Format:</span> <span className="font-semibold text-slate-600">A4 Portrait</span></p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleDownloadDocx}
                        disabled={isGeneratingDoc || validImages.length === 0}
                        className={`px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2
              ${(isGeneratingDoc || validImages.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                    >
                        {isGeneratingDoc ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
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
