import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { RING_CENTER } from '../../hooks/useConceptRing.ts';

interface ConceptRingProps {
  children: ReactNode;
}

/**
 * SVG wrapper with zoom (scroll) and pan (drag) support.
 */
export function ConceptRing({ children }: ConceptRingProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Use native listener for wheel to allow non-passive (preventDefault works)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => Math.max(0.3, Math.min(3, s * factor)));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastOffset.current = offset;
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({
      x: lastOffset.current.x + dx,
      y: lastOffset.current.y + dy,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const svgCenterX = 500;
  const svgCenterY = 350;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden select-none"
    >
      {/* Toolbar */}
      <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2">
        <span className="rounded-lg bg-slate-900/70 px-2.5 py-1 text-xs text-slate-500 backdrop-blur-sm border border-slate-700/30">
          {Math.round(scale * 100)}%
        </span>
        {scale !== 1 && (
          <button
            onClick={resetView}
            className="rounded-lg bg-slate-900/70 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 backdrop-blur-sm border border-slate-700/30 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid meet"
        style={{
          overflow: 'visible',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className="h-full w-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Apply zoom/pan transform */}
        <g
          transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}
          style={{ transformOrigin: `${svgCenterX}px ${svgCenterY}px` }}
        >
          {/* Background reference rings */}
          <circle
            cx={RING_CENTER.x}
            cy={RING_CENTER.y}
            r={260}
            fill="none"
            stroke="#1e293b"
            strokeWidth={0.5}
            strokeDasharray="4,6"
            opacity={0.3}
          />
          <circle
            cx={RING_CENTER.x}
            cy={RING_CENTER.y}
            r={130}
            fill="none"
            stroke="#1e293b"
            strokeWidth={0.5}
            strokeDasharray="2,4"
            opacity={0.2}
          />

          {children}
        </g>
      </svg>
    </div>
  );
}
