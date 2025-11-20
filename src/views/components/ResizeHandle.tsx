import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';

type ResizeDirection = 'horizontal' | 'vertical' | 'corner';
type HorizontalPosition = 'left' | 'right';
type VerticalPosition = 'top' | 'bottom';

interface ResizeHandleProps {
    direction: ResizeDirection;
    position?: HorizontalPosition | VerticalPosition;
    onResize: (delta: { x: number; y: number }) => void;
    onResizeStart?: () => void;
    onResizeEnd?: () => void;
    minSize?: number;
    maxSize?: number;
}

export const ResizeHandle = ({
    direction,
    position,
    onResize,
    onResizeStart,
    onResizeEnd,
}: ResizeHandleProps) => {
    const handleRef = useRef<HTMLDivElement>(null);
    const startPos = useRef({ x: 0, y: 0 });
    const isResizing = useRef(false);

    useEffect(() => {
        const handle = handleRef.current;
        if (!handle) return;

        const handleMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            isResizing.current = true;
            startPos.current = { x: e.clientX, y: e.clientY };

            if (onResizeStart) {
                onResizeStart();
            }

            document.body.setCssProps({ cursor: getCursor(), userSelect: 'none' });
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;

            e.preventDefault();

            const deltaX = e.clientX - startPos.current.x;
            const deltaY = e.clientY - startPos.current.y;

            startPos.current = { x: e.clientX, y: e.clientY };

            onResize({ x: deltaX, y: deltaY });
        };

        const handleMouseUp = () => {
            if (!isResizing.current) return;

            isResizing.current = false;
            document.body.setCssProps({ cursor: '', userSelect: '' });

            if (onResizeEnd) {
                onResizeEnd();
            }
        };

        handle.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            handle.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onResize, onResizeStart, onResizeEnd]);

    const getCursor = () => {
        if (direction === 'horizontal') return 'col-resize';
        if (direction === 'vertical') return 'row-resize';
        return 'nwse-resize';
    };

    const getClassName = () => {
        const classes = ['resize-handle'];

        if (direction === 'horizontal') {
            classes.push('resize-handle-horizontal');
            if (position) {
                classes.push(`resize-handle-horizontal-${position}`);
            }
        } else if (direction === 'vertical') {
            classes.push('resize-handle-vertical');
            if (position) {
                classes.push(`resize-handle-vertical-${position}`);
            }
        } else if (direction === 'corner') {
            classes.push('resize-handle-corner');
            if (position) {
                classes.push(`resize-handle-corner-${position}`);
            }
        }

        return classes.join(' ');
    };

    return <div ref={handleRef} className={getClassName()} />;
};
