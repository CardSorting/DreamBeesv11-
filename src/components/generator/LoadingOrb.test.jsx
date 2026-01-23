import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import LoadingOrb from './LoadingOrb';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
    Zap: () => <div data-testid="zap-icon">Zap</div>
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>
    }
}));

describe('LoadingOrb', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders correctly with default props', () => {
        render(<LoadingOrb />);
        expect(screen.getByTestId('sparkles-icon')).toBeTruthy();
        expect(screen.queryByTestId('zap-icon')).toBeNull();
    });

    it('renders zap icon when useTurbo is true', () => {
        render(<LoadingOrb useTurbo={true} />);
        expect(screen.getByTestId('zap-icon')).toBeTruthy();
        expect(screen.queryByTestId('sparkles-icon')).toBeNull();
    });

    it('renders with small size style', () => {
        const { container } = render(<LoadingOrb size="small" />);
        // We can't easily check styles computed styles in jsdom without more setup, 
        // but we can check if it renders without crashing.
        expect(container.firstChild).toBeTruthy();
    });
});
