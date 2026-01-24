
import React from 'react';
import { Download, RefreshCw, ArrowRight } from 'lucide-react';

export const ResultView = ({ result, onReset }) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = result.generatedUrl;
        link.download = `meowacc-creation-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full flex flex-col gap-8 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6 items-start justify-center">

                {/* Original */}
                <div className="flex-1 flex flex-col gap-3 group w-full">
                    <div className="font-display font-bold text-center text-meow-text text-lg flex items-center justify-center gap-2">
                        <span className="bg-white/50 px-3 py-1 rounded-full text-sm">Original</span>
                    </div>
                    <div className="relative rounded-3xl overflow-hidden glass-panel shadow-sm p-2 group-hover:scale-[1.02] transition-transform duration-300">
                        <img
                            src={result.originalUrl}
                            alt="Original"
                            className="w-full h-auto rounded-2xl max-h-[70vh] object-contain mx-auto"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-center text-purple-300 md:rotate-0 rotate-90 self-center">
                    <ArrowRight className="w-8 h-8 md:w-12 md:h-12 animate-pulse" />
                </div>

                {/* Generated */}
                <div className="flex-1 flex flex-col gap-3 group w-full">
                    <div className="font-display font-bold text-center text-pink-500 text-lg flex items-center justify-center gap-2">
                        <span className="bg-pink-100 px-3 py-1 rounded-full text-sm shadow-sm border border-pink-200">✨ MEOWACC ✨</span>
                    </div>
                    <div className="relative rounded-3xl overflow-hidden glass-panel kawaii-shadow border-pink-200 p-2 group-hover:scale-[1.02] transition-transform duration-300 bg-gradient-to-br from-pink-50 to-purple-50">
                        <img
                            src={result.generatedUrl}
                            alt="Meowacc Transformation"
                            className="w-full h-auto rounded-2xl max-h-[70vh] object-contain mx-auto"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-4 justify-center mt-4">
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-meow-text font-bold shadow-md hover:bg-gray-50 hover:shadow-lg transition-all border border-gray-100"
                >
                    <RefreshCw size={20} />
                    Start Over
                </button>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold shadow-lg shadow-pink-200/50 hover:shadow-pink-300/60 hover:-translate-y-1 transition-all"
                >
                    <Download size={20} />
                    Save Creation
                </button>
            </div>
        </div>
    );
};
