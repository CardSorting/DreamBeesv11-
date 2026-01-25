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
        <div className="cc-modal-overlay">
            {/* Backdrop */}
            <div
                className="cc-modal-backdrop"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="cc-modal-content" style={{ maxWidth: '48rem', maxHeight: '90vh' }}>

                {/* Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
                    <div className="flex items-center gap-3">
                        <div style={{ backgroundColor: '#e0e7ff', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <Plus style={{ width: '1.25rem', height: '1.25rem', color: '#4f46e5' }} />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 'bold', color: '#1e293b' }}>Batch Creator</h3>
                            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Add multiple pages to your queue at once.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ color: '#94a3b8', padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s' }}
                    >
                        <X style={{ width: '1.25rem', height: '1.25rem' }} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: 0, flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>

                    {/* Toolbar */}
                    <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowPasteMode(!showPasteMode)}
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.375rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    backgroundColor: showPasteMode ? '#e0e7ff' : 'transparent',
                                    color: showPasteMode ? '#4338ca' : '#4f46e5'
                                }}
                            >
                                {showPasteMode ? <X style={{ width: '1rem', height: '1rem' }} /> : <AlignLeft style={{ width: '1rem', height: '1rem' }} />}
                                {showPasteMode ? "Close Paste Tool" : "Paste List or JSON"}
                            </button>

                            <div style={{ height: '1rem', width: '1px', backgroundColor: '#e2e8f0', margin: '0 0.25rem' }}></div>

                            <button
                                onClick={handleCopyTemplate}
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.375rem 0.5rem',
                                    borderRadius: '0.25rem'
                                }}
                            >
                                {templateCopied ? <Check style={{ width: '0.875rem', height: '0.875rem', color: '#22c55e' }} /> : <Copy style={{ width: '0.875rem', height: '0.875rem' }} />}
                                {templateCopied ? "Copied!" : "Copy 30-Page Template"}
                            </button>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>
                            {rows.length} {rows.length === 1 ? 'item' : 'items'}
                        </div>
                    </div>

                    {/* Paste Overlay */}
                    {showPasteMode && (
                        <div style={{ padding: '1rem', backgroundColor: '#eef2ff', borderBottom: '1px solid #e0e7ff', animation: 'cc-slide-in-top 0.2s ease-out' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#3730a3', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileJson style={{ width: '0.75rem', height: '0.75rem' }} />
                                    Paste text list OR JSON template
                                </span>
                                <span style={{ fontSize: '10px', color: 'rgba(79, 70, 229, 0.7)' }}>
                                    Auto-detects format
                                </span>
                            </div>
                            <textarea
                                value={pasteContent}
                                onChange={(e) => setPasteContent(e.target.value)}
                                placeholder={'Example List:\nCat on a roof\nDog in a park\n\nExample JSON:\n[{"prompt": "Dragon", "style": "anime"}]'}
                                className="cc-textarea"
                                style={{ height: '8rem', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '0.75rem', backgroundColor: 'white' }}
                                autoFocus
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setShowPasteMode(false)}
                                    className="cc-btn cc-btn-white"
                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProcessPaste}
                                    disabled={!pasteContent.trim()}
                                    className="cc-btn cc-btn-primary"
                                    style={{ padding: '0.375rem 1rem', fontSize: '0.75rem', opacity: !pasteContent.trim() ? 0.5 : 1 }}
                                >
                                    Process & Add
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Scrollable Rows */}
                    <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {rows.map((row, index) => (
                            <div key={row.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }} className="cc-only-sm">
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8' }}>Page {index + 1}</span>
                                    <button
                                        onClick={() => handleDeleteRow(row.id)}
                                        style={{ color: '#94a3b8', padding: '0.25rem' }}
                                    >
                                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                                    </button>
                                </div>

                                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#cbd5e1', width: '1.5rem', textAlign: 'right' }} className="cc-hidden-sm">{index + 1}</span>
                                    <input
                                        type="text"
                                        value={row.prompt}
                                        onChange={(e) => handleUpdateRow(row.id, 'prompt', e.target.value)}
                                        placeholder="Describe what you want to color..."
                                        style={{ flexGrow: 1, backgroundColor: 'transparent', outline: 'none', border: 'none', fontSize: '0.875rem', color: '#1e293b' }}
                                        autoFocus={index === rows.length - 1 && !showPasteMode}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                                    <select
                                        value={row.style}
                                        onChange={(e) => handleUpdateRow(row.id, 'style', e.target.value)}
                                        style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '500', color: '#475569', borderRadius: '0.5rem', padding: '0.375rem 0.5rem', outline: 'none', cursor: 'pointer', width: '100%' }}
                                    >
                                        {styles.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => handleDeleteRow(row.id)}
                                        className="cc-hidden-sm"
                                        style={{ color: '#cbd5e1', padding: '0.5rem', borderRadius: '0.5rem', transition: 'color 0.2s' }}
                                        title="Remove row"
                                    >
                                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleAddRow}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px dashed #e2e8f0',
                                borderRadius: '0.75rem',
                                color: '#64748b',
                                fontWeight: '500',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Plus style={{ width: '1rem', height: '1rem' }} />
                            Add Another Page
                        </button>
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
                        onClick={handleCreate}
                        disabled={rows.filter(r => r.prompt.trim()).length === 0}
                        className="cc-btn cc-btn-primary"
                        style={{
                            padding: '0.5rem 1.5rem',
                            opacity: rows.filter(r => r.prompt.trim()).length === 0 ? 0.5 : 1,
                            cursor: rows.filter(r => r.prompt.trim()).length === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Wand2 style={{ width: '1rem', height: '1rem' }} />
                        Create {rows.filter(r => r.prompt.trim()).length} Pages
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JsonImportModal;
