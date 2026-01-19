import JSZip from 'jszip';
import { generateMockup } from './geminiService';
import { presetFactory } from './PresetFactory';
import { MOCKUP_ITEMS } from './mockupData';

export class BulkService {
    constructor() {
        this.isCancelled = false;
    }

    cancel() {
        this.isCancelled = true;
    }

    async processItems(items, file, onProgress) {
        const presets = presetFactory.getPresets();
        const zip = new JSZip();

        let processed = 0;
        let success = 0;

        for (const item of items) {
            if (this.isCancelled) break;

            onProgress({
                total: items.length,
                current: processed + 1,
                currentLabel: item.label,
                successCount: success,
                lastImagePreview: undefined
            });

            try {
                // Pick a random preset
                const randomPreset = presets[Math.floor(Math.random() * presets.length)];

                // Interpolate prompt
                const scenePromptTemplate = randomPreset.prompt;
                const interpolatedScenePrompt = scenePromptTemplate.replace(/{subject}/g, item.subjectNoun);

                // Memory Affordance 1: Yield to event loop before heavy lifting
                await new Promise(r => setTimeout(r, 100));

                const base64DataUrl = await generateMockup(file, interpolatedScenePrompt, {
                    quality: 'standard', // Optimize for speed/memory
                    format: item.formatSpec
                });

                // Clean base64 string for ZIP (remove data:image/png;base64, prefix)
                const base64Data = base64DataUrl.split(',')[1];
                const extension = base64DataUrl.substring(base64DataUrl.indexOf('/') + 1, base64DataUrl.indexOf(';'));
                const filename = `${item.label.replace(/\s+/g, '_')}_${randomPreset.label.replace(/\s+/g, '_')}_${Date.now()}.${extension}`;

                // 2. Add directly to buffer
                zip.file(filename, base64Data, { base64: true });

                success++;

                // Update progress with preview
                onProgress({
                    total: items.length,
                    current: processed + 1, // Keep current index
                    currentLabel: item.label,
                    successCount: success,
                    lastImagePreview: base64DataUrl // Transient preview
                });

            } catch (error) {
                console.error(`Failed to generate ${item.label}:`, error);
                // Continue to next item even if this one failed
            }

            processed++;

            // Memory Affordance 2: Significant pause to allow GC and browser UI rendering to catch up
            await new Promise(r => setTimeout(r, 500));
        }

        if (success === 0) {
            return null;
        }

        onProgress({
            total: items.length,
            current: processed,
            currentLabel: 'Compressing archive...',
            successCount: success,
            lastImagePreview: undefined
        });

        // 3. Finalize Buffer
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: "DEFLATE",
            compressionOptions: {
                level: 6 // Balanced compression
            }
        });

        return zipBlob;
    }

    async generateAll(file, onProgress) {
        this.isCancelled = false;
        return this.processItems(MOCKUP_ITEMS, file, onProgress);
    }

    async generateRandomSubset(file, count, onProgress) {
        this.isCancelled = false;
        // Shuffle and slice
        const shuffled = [...MOCKUP_ITEMS].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));
        return this.processItems(selected, file, onProgress);
    }
}

export const bulkService = new BulkService();
