import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
import LoadingModal from './LoadingModal';

// Mock LoadingOrb
vi.mock('./LoadingOrb', () => ({
    default: () => <div data-testid="loading-orb">LoadingOrb</div>
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    X: () => <div data-testid="close-icon">X</div>,
    Zap: () => <div data-testid="zap-icon">Zap</div>
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        p: ({ children, ...props }) => <p {...props}>{children}</p>
    },
    AnimatePresence: ({ children }) => <>{children}</>
}));

describe('LoadingModal', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        cleanup();
    });

    it('renders correctly with default props', () => {
        render(<LoadingModal useTurbo={false} />);
        expect(screen.getByText('Creating')).toBeTruthy();
        expect(screen.getByText('Dreaming up your vision...')).toBeTruthy();
        expect(screen.getByTestId('loading-orb')).toBeTruthy();
        expect(screen.queryByText('TURBO MODE ACTIVE')).toBeNull();
    });

    it('shows turbo badge when useTurbo is true', () => {
        render(<LoadingModal useTurbo={true} />);
        expect(screen.getByText('TURBO MODE ACTIVE')).toBeTruthy();
    });

    it('shows stop button and calls onCancel', () => {
        const onCancel = vi.fn();
        render(<LoadingModal onCancel={onCancel} />);

        const stopButton = screen.getByText('Stop Generating');
        expect(stopButton).toBeTruthy();

        fireEvent.click(stopButton);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('cycles through loading messages', () => {
        render(<LoadingModal />);
        expect(screen.getByText('Dreaming up your vision...')).toBeTruthy();

        // Fast forward 2.5s
        act(() => {
            vi.advanceTimersByTime(2500);
        });
        expect(screen.getByText('Mixing pixels and imagination...')).toBeTruthy();

        // Fast forward another 2.5s
        act(() => {
            vi.advanceTimersByTime(2500);
        });
        expect(screen.getByText('Applying artistic styles...')).toBeTruthy();
    });

    it('shows grace message after timeout', () => {
        render(<LoadingModal />);

        // Default message
        expect(screen.getByText('Dreaming up your vision...')).toBeTruthy();

        // Fast forward 12s (grace timeout)
        act(() => {
            vi.advanceTimersByTime(12000);
        });

        // Should show one of the grace messages
        const graceMessages = [
            "This is taking a bit longer than usual...",
            "Complex prompts need a little more time...",
            "Our GPUs are crunching hard for you..."
        ];

        const currentText = screen.getByText((content) => {
            return graceMessages.includes(content);
        });
        expect(currentText).toBeTruthy();
    });
});
