import { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

const ComparisonSlider = ({ before, after, isMobile }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [showHint, setShowHint] = useState(true);
    const [containerWidth, setContainerWidth] = useState(null);
    const containerRef = useRef(null);
    const touchStartX = useRef(null);

    const updatePosition = useCallback((clientX) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const position = ((clientX - rect.left) / rect.width) * 100;
        setSliderPos(Math.min(Math.max(position, 0), 100));
    }, []);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        updatePosition(e.clientX);
    };

    const handleTouchStart = (e) => {
        setIsDragging(true);
        touchStartX.current = e.touches[0].clientX;
        updatePosition(e.touches[0].clientX);
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        e.preventDefault();
        updatePosition(e.clientX);
    }, [isDragging, updatePosition]);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;
        // Prevent scrolling while dragging the slider
        if (e.cancelable) {
            e.preventDefault();
        }
        updatePosition(e.touches[0].clientX);
    }, [isDragging, updatePosition]);

    const handleEnd = useCallback(() => {
        setIsDragging(false);
        touchStartX.current = null;
        setShowHint(false);
    }, []);

    // Global event listeners for drag
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove, { passive: false });
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

    useEffect(() => {
        if (!containerRef.current) return;

        const updateWidth = () => {
            setContainerWidth(containerRef.current?.offsetWidth || null);
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(updateWidth);
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // Handle click/tap to position
    const handleContainerClick = (e) => {
        if (isDragging) return;
        updatePosition(e.clientX || e.touches?.[0]?.clientX);
        setShowHint(false);
    };

    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onClick={handleContainerClick}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                borderRadius: 'inherit',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none'
            }}
        >
            {/* After Image (Background) */}
            <img
                src={after}
                alt="After"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none'
                }}
                draggable={false}
                crossOrigin="anonymous"
            />

            {/* Before Image (Top Layer) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${sliderPos}%`,
                height: '100%',
                overflow: 'hidden',
                borderRight: isMobile ? '3px solid white' : '2px solid white',
                boxShadow: isMobile ? '2px 0 8px rgba(0,0,0,0.3)' : 'none'
            }}>
                <img
                    src={before}
                    alt="Before"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        minWidth: containerWidth ? `${containerWidth}px` : '100%',
                        pointerEvents: 'none'
                    }}
                    draggable={false}
                    crossOrigin="anonymous"
                />
            </div>

            {/* Slider Handle */}
            <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${sliderPos}%`,
                width: isMobile ? '4px' : '2px',
                background: 'white',
                transform: 'translateX(-50%)',
                zIndex: 20,
                pointerEvents: 'none'
            }}>
                {/* Touch-friendly handle on mobile */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isMobile ? '56px' : '40px',
                    height: isMobile ? '56px' : '40px',
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isMobile
                        ? '0 4px 20px rgba(0,0,0,0.4), 0 0 0 4px rgba(168, 85, 247, 0.2)'
                        : '0 4px 12px rgba(0,0,0,0.3)',
                    color: '#6366f1',
                    pointerEvents: 'auto',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}>
                    <GripVertical size={isMobile ? 24 : 20} />
                </div>
            </div>

            {/* Labels */}
            <div style={{
                position: 'absolute',
                bottom: isMobile ? '12px' : '20px',
                left: isMobile ? '12px' : '20px',
                padding: isMobile ? '4px 10px' : '4px 12px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                color: 'white',
                fontSize: isMobile ? '0.6rem' : '0.7rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                opacity: sliderPos > 20 ? 1 : 0,
                transition: 'opacity 0.2s',
                pointerEvents: 'none'
            }}>
                Original
            </div>

            <div style={{
                position: 'absolute',
                bottom: isMobile ? '12px' : '20px',
                right: isMobile ? '12px' : '20px',
                padding: isMobile ? '4px 10px' : '4px 12px',
                background: 'var(--color-accent-primary)',
                borderRadius: '8px',
                color: 'white',
                fontSize: isMobile ? '0.6rem' : '0.7rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                opacity: sliderPos < 80 ? 1 : 0,
                transition: 'opacity 0.2s',
                pointerEvents: 'none'
            }}>
                Edit
            </div>

            {/* Compare hint */}
            {showHint && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: isMobile ? '8px 16px' : '10px 18px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '20px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '600',
                    pointerEvents: 'none',
                    opacity: isDragging ? 0 : 0.85,
                    transition: 'opacity 0.3s'
                }}>
                    {isMobile ? 'Drag to compare' : 'Drag slider to compare'}
                </div>
            )}
        </div>
    );
};

export default ComparisonSlider;