import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
import LoadingModal from './LoadingModal';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    X: () => <div data-testid="close-icon">X</div>,
    Zap: () => <div data-testid="zap-icon">Zap</div>
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        span: ({ children, ...props }) => <span {...props}>{children}</span>,
        button: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>
    }
}));

describe('LoadingModal', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        cleanup();
    });

    it('renders with initial 0s timer', () => {
        render(<LoadingModal useTurbo={false} />);
        expect(screen.getByText('0s')).toBeTruthy();
        expect(screen.getByText('Generating')).toBeTruthy();
    });

    it('shows turbo indicator when useTurbo is true', () => {
        render(<LoadingModal useTurbo={true} />);
        expect(screen.getByText('Generating with Turbo')).toBeTruthy();
        expect(screen.getByTestId('zap-icon')).toBeTruthy();
    });

    it('shows cancel button and calls onCancel', () => {
        const onCancel = vi.fn();
        render(<LoadingModal onCancel={onCancel} />);

        const cancelButton = screen.getByText('Cancel');
        expect(cancelButton).toBeTruthy();

        fireEvent.click(cancelButton);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('increments elapsed timer every second', () => {
        render(<LoadingModal />);
        expect(screen.getByText('0s')).toBeTruthy();

        // Fast forward 1 second
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.getByText('1s')).toBeTruthy();

        // Fast forward to 5 seconds
        act(() => {
            vi.advanceTimersByTime(4000);
        });
        expect(screen.getByText('5s')).toBeTruthy();
    });

    it('formats elapsed time correctly for minutes', () => {
        render(<LoadingModal />);

        // Fast forward to 65 seconds (1:05)
        act(() => {
            vi.advanceTimersByTime(65000);
        });
        expect(screen.getByText('1:05')).toBeTruthy();

        // Fast forward to 2:05
        act(() => {
            vi.advanceTimersByTime(60000);
        });
        expect(screen.getByText('2:05')).toBeTruthy();
    });

    it('does not show cancel button when onCancel is not provided', () => {
        render(<LoadingModal />);
        expect(screen.queryByText('Cancel')).toBeNull();
    });
});
