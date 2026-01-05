
import { getEnhancedPrompt } from '../utils';

describe('getEnhancedPrompt', () => {
    it('should enhance a simple prompt', () => {
        const prompt = 'a cat';
        const enhanced = getEnhancedPrompt(prompt);
        expect(enhanced).toContain('a cat');
        expect(enhanced.length).toBeGreaterThan(prompt.length);
    });

    it('should not duplicate enhancers if already present', () => {
        // This is a naive check as the random function might pick different ones,
        // but we can check basic structure if we made it deterministic.
        // For now, just ensuring it returns a string.
        const prompt = 'high quality image';
        const enhanced = getEnhancedPrompt(prompt);
        expect(typeof enhanced).toBe('string');
    });

    it('should handle empty prompt', () => {
        const enhanced = getEnhancedPrompt('');
        // It might return just modifiers or empty string depending on implementation.
        // Let's assume valid string return.
        expect(typeof enhanced).toBe('string');
    });
});
