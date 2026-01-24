import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Wand2, AlignLeft, Check, FileJson, Copy } from 'lucide-react';
import { ArtStyle } from '../constants';

const JsonImportModal = ({ isOpen, onClose, onImport }) => {
    const [rows, setRows] = useState([]);
    const [showPasteMode, setShowPasteMode] = useState(false);
    const [pasteContent, setPasteContent] = useState('');
    const [templateCopied, setTemplateCopied] = useState(false);

    // Reset when opening
    useEffect(() => {
        if (isOpen && rows.length === 0) {
            setRows([{ id: crypto.randomUUID(), prompt: '', style: ArtStyle.SIMPLE }]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAddRow = () => {
        setRows(prev => [...prev, { id: crypto.randomUUID(), prompt: '', style: ArtStyle.SIMPLE }]);
    };

    const handleUpdateRow = (id, field, value) => {
        setRows(prev => prev.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleDeleteRow = (id) => {
        setRows(prev => prev.filter(row => row.id !== id));
    };

    const handleCopyTemplate = async () => {
        // Generate a complete 30-page book flow
        const themes = [
            "Front Cover: Magical Forest Title Page with Vines",
            "Page 1: A cute baby deer sleeping under a fern",
            "Page 2: A wise old owl wearing reading glasses on a branch",
            "Page 3: A friendly squirrel holding a giant acorn",
            "Page 4: Detailed forest floor with mushrooms and snails",
            "Page 5: A wooden bridge crossing a babbling brook",
            "Page 6: Mandala pattern made of oak leaves and acorns",
            "Page 7: A hidden fairy door in a tree trunk",
            "Page 8: A family of rabbits having tea",
            "Page 9: A detailed butterfly resting on a wildflower",
            "Page 10: Mandala pattern of blooming flowers",
            "Page 11: A bear cub climbing a tree",
            "Page 12: A fox peeking out from a hollow log",
            "Page 13: Detailed pinecone and needle arrangement",
            "Page 14: A raccoon washing its hands in the stream",
            "Page 15: Mandala pattern of sun rays and clouds",
            "Page 16: A hedgehog rolling in autumn leaves",
            "Page 17: A majestic stag standing on a hill",
            "Page 18: Detailed tree bark texture with moss",
            "Page 19: A woodpecker on a birch tree",
            "Page 20: Mandala pattern of snowflakes (Winter is coming)",
            "Page 21: A wolf howling at the moon",
            "Page 22: A cozy log cabin in the woods",
            "Page 23: Detailed spiderweb with morning dew drops",
            "Page 24: A frog sitting on a lily pad",
            "Page 25: Mandala pattern of stars and moon phases",
            "Page 26: A mysterious path leading into the mist",
            "Page 27: A unicorn grazing in a clearing (Fantasy twist)",
            "Page 28: Detailed ancient stone ruins covered in ivy",
            "Page 29: A dragon sleeping on a pile of leaves",
            "Page 30: Back Cover: The End with a sleeping cat"
        ];

        const pages = themes.map((theme) => {
            let style = ArtStyle.SIMPLE;
            const lower = theme.toLowerCase();
            if (lower.includes("detailed") || lower.includes("texture") || lower.includes("ruins")) style = ArtStyle.DETAILED;
            else if (lower.includes("mandala") || lower.includes("pattern")) style = ArtStyle.MANDALA;
            else if (lower.includes("dragon") || lower.includes("unicorn") || lower.includes("magic")) style = ArtStyle.ANIME;

            return {
                prompt: theme,
                style: style
            };
        });

        const template = {
            metadata: {
                title: "30-Page Forest Adventure Book",
                created: new Date().toISOString()
            },
            pages: pages
        };

        try {
            await navigator.clipboard.writeText(JSON.stringify(template, null, 2));
            setTemplateCopied(true);
            setTimeout(() => setTemplateCopied(false), 2000);

            // Auto-open paste mode if not already open to hint the user
            if (!showPasteMode) {
                setShowPasteMode(true);
            }
        } catch (err) {
            console.error('Failed to copy template', err);
        }
    };

    const handleProcessPaste = () => {
        const raw = pasteContent.trim();
        if (!raw) return;

        let newRows = [];
        let isJson = false;

        // 1. Try parsing as JSON first
        if (raw.startsWith('{') || raw.startsWith('[')) {
            try {
                const parsed = JSON.parse(raw);
                let items = [];

                // Support array [] or object { pages: [] }
                if (Array.isArray(parsed)) {
                    items = parsed;
                } else if (parsed && typeof parsed === 'object') {
                    // Look for common array keys
                    if (Array.isArray(parsed.pages)) items = parsed.pages;
                    else if (Array.isArray(parsed.items)) items = parsed.items;
                    else if (Array.isArray(parsed.images)) items = parsed.images;
                }

                if (items.length > 0) {
                    isJson = true;
                    newRows = items.map((item) => {
                        // Heuristics to find the prompt
                        let prompt = '';
                        if (typeof item === 'string') prompt = item;
                        else {
                            prompt = item.prompt || item.theme || item.description || item.text || item.title || '';
                        }

                        // Normalize prompt to string
                        if (typeof prompt !== 'string') prompt = JSON.stringify(prompt);

                        // Heuristics to find and map the style
                        let styleStr = item.style || '';
                        let style = ArtStyle.SIMPLE;
                        const s = String(styleStr).toLowerCase();

                        if (s.includes('detailed') || s.includes('realistic') || s.includes('complex')) style = ArtStyle.DETAILED;
                        else if (s.includes('mandala') || s.includes('pattern') || s.includes('geometric')) style = ArtStyle.MANDALA;
                        else if (s.includes('anime') || s.includes('manga')) style = ArtStyle.ANIME;

                        return {
                            id: crypto.randomUUID(),
                            prompt: prompt,
                            style: style
                        };
                    }).filter(r => r.prompt.trim()); // Filter out empty prompts
                }
            } catch (e) {
                console.warn("Paste looked like JSON but failed to parse, falling back to text lines.", e);
                // Fall through to text handling
            }
        }

        // 2. Fallback to Line Splitting
        if (!isJson || newRows.length === 0) {
            const lines = raw.split(/\n/).filter(line => line.trim() !== '');
            newRows = lines.map(line => ({
                id: crypto.randomUUID(),
                prompt: line.trim(),
                style: ArtStyle.SIMPLE
            }));
        }

        // 3. Update State
        if (newRows.length > 0) {
            // If the only current row is empty, replace it. Otherwise append.
            if (rows.length === 1 && !rows[0].prompt.trim()) {
                setRows(newRows);
            } else {
                setRows(prev => [...prev, ...newRows]);
            }
            setPasteContent('');
            setShowPasteMode(false);
        }
    };

    const handleCreate = () => {
        const validRows = rows.filter(r => r.prompt.trim() !== '');

        if (validRows.length === 0) {
            onClose();
            return;
        }

        const importedImages = validRows.map(row => ({
            id: row.id,
            prompt: row.prompt,
            style: row.style, // Assuming style string matches ArtStyle enum values or keys
            createdAt: Date.now(),
            status: 'pending'
        }));

        onImport(importedImages);
        setRows([{ id: crypto.randomUUID(), prompt: '', style: ArtStyle.SIMPLE }]); // Reset
        onClose();
    };

    const styles = [
        { value: ArtStyle.SIMPLE, label: 'Simple' },
        { value: ArtStyle.DETAILED, label: 'Realistic' },
        { value: ArtStyle.MANDALA, label: 'Mandala' },
        { value: ArtStyle.ANIME, label: 'Anime' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <Plus className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Batch Creator</h3>
                            <p className="text-xs text-slate-500">Add multiple pages to your queue at once.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-0 flex-grow overflow-hidden flex flex-col relative bg-slate-50/50">

                    {/* Toolbar */}
                    <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowPasteMode(!showPasteMode)}
                                className={`text-xs font-medium flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors
                    ${showPasteMode
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                                    }`}
                            >
                                {showPasteMode ? <X className="w-4 h-4" /> : <AlignLeft className="w-4 h-4" />}
                                {showPasteMode ? "Close Paste Tool" : "Paste List or JSON"}
                            </button>

                            <div className="h-4 w-px bg-slate-200 mx-1"></div>

                            <button
                                onClick={handleCopyTemplate}
                                className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 hover:bg-slate-50 px-2 py-1.5 rounded transition-colors"
                            >
                                {templateCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {templateCopied ? "Copied!" : "Copy 30-Page Template"}
                            </button>
                        </div>

                        <div className="text-xs text-slate-400 font-medium">
                            {rows.length} {rows.length === 1 ? 'item' : 'items'}
                        </div>
                    </div>

                    {/* Paste Overlay */}
                    {showPasteMode && (
                        <div className="p-4 bg-indigo-50 border-b border-indigo-100 animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-indigo-800 flex items-center gap-2">
                                    <FileJson className="w-3 h-3" />
                                    Paste text list OR JSON template
                                </span>
                                <span className="text-[10px] text-indigo-600/70">
                                    Auto-detects format
                                </span>
                            </div>
                            <textarea
                                value={pasteContent}
                                onChange={(e) => setPasteContent(e.target.value)}
                                placeholder={'Example List:\nCat on a roof\nDog in a park\n\nExample JSON:\n[{"prompt": "Dragon", "style": "anime"}]'}
                                className="w-full h-32 p-3 rounded-xl border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-mono resize-none bg-white mb-3 placeholder:text-slate-300"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowPasteMode(false)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProcessPaste}
                                    disabled={!pasteContent.trim()}
                                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
                                >
                                    Process & Add
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Scrollable Rows */}
                    <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-3">
                        {rows.map((row, index) => (
                            <div key={row.id} className="group flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                                <div className="flex items-center justify-between sm:hidden mb-1">
                                    <span className="text-xs font-bold text-slate-400">Page {index + 1}</span>
                                    <button
                                        onClick={() => handleDeleteRow(row.id)}
                                        className="text-slate-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex-grow flex items-center gap-3">
                                    <span className="hidden sm:block text-xs font-bold text-slate-300 w-6 text-right">{index + 1}</span>
                                    <input
                                        type="text"
                                        value={row.prompt}
                                        onChange={(e) => handleUpdateRow(row.id, 'prompt', e.target.value)}
                                        placeholder="Describe what you want to color..."
                                        className="flex-grow bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                                        autoFocus={index === rows.length - 1 && !showPasteMode}
                                    />
                                </div>

                                <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-2 mt-1 sm:mt-0">
                                    <select
                                        value={row.style}
                                        onChange={(e) => handleUpdateRow(row.id, 'style', e.target.value)}
                                        className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 w-full sm:w-32 cursor-pointer hover:bg-slate-100"
                                    >
                                        {styles.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => handleDeleteRow(row.id)}
                                        className="hidden sm:flex text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Remove row"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleAddRow}
                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-medium text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Another Page
                        </button>
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
                        onClick={handleCreate}
                        disabled={rows.filter(r => r.prompt.trim()).length === 0}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Wand2 className="w-4 h-4" />
                        Create {rows.filter(r => r.prompt.trim()).length} Pages
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JsonImportModal;
