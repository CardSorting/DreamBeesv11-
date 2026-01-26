import React, { useRef } from 'react';
import { Download, Share2, CornerUpRight, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export default function ShareCard({ imageUrl, prompt, modelName }) {
    const cardRef = useRef(null);

    const downloadCard = async () => {
        if (!cardRef.current) return;
        try {
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#000000'
            });
            const link = document.createElement('a');
            link.download = `dreambees-creation-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success("Share card downloaded!");
        } catch (err) {
            console.error("Failed to generate share card", err);
            toast.error("Failed to generate share card");
        }
    };

    const copyRemixLink = () => {
        // In a real app, this would be a link to the generation page with the prompt/model pre-filled
        const remixLink = `${window.location.origin}/generate?prompt=${encodeURIComponent(prompt)}&model=${encodeURIComponent(modelName)}`;
        navigator.clipboard.writeText(remixLink);
        toast.success("Remix link copied!");
    };

    return (
        <div className="share-card-container space-y-4">
            {/* The actual card that gets captured */}
            <div
                ref={cardRef}
                className="share-card relative w-full aspect-[4/5] bg-black overflow-hidden rounded-2xl border border-white/10"
                style={{ maxWidth: '400px', margin: '0 auto' }}
            >
                <img
                    src={imageUrl}
                    alt="Generation"
                    className="w-full h-full object-cover"
                />

                {/* Branding Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <img src="/dreambees_icon.png" alt="Logo" className="w-6 h-6" />
                            <span className="text-sm font-bold tracking-tighter text-white">DREAMBEES AI</span>
                        </div>
                        <p className="text-xs text-zinc-300 line-clamp-2 italic">
                            "{prompt}"
                        </p>
                        <div className="flex justify-between items-center pt-2 border-t border-white/10">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{modelName}</span>
                            <span className="text-[10px] text-purple-400 font-mono">dreambeesai.com</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3">
                <button
                    onClick={downloadCard}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-sm font-medium"
                >
                    <Download size={16} />
                    Save Card
                </button>
                <button
                    onClick={copyRemixLink}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-full transition-all text-sm font-medium"
                >
                    <CornerUpRight size={16} />
                    Remix
                </button>
            </div>
        </div>
    );
}
