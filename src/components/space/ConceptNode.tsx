import { useState, useEffect, useRef } from 'react';
import type { Concept } from '../../types/concept.ts';
import { RING_CENTER } from '../../hooks/useConceptRing.ts';
import { speak } from '../../engine/speak.ts';

interface ConceptNodeProps {
  concept: Concept;
  x: number;
  y: number;
  isCenter: boolean;
  isActivated: boolean;
  explanation: string;
  onClick: () => void;
  onActivate: () => void;
  animate?: boolean;
}

function splitExplanation(text: string): [string, string] {
  if (text.length <= 40) return [text, ''];
  const mid = text.lastIndexOf(' ', 36);
  const breakAt = mid > 20 ? mid : 36;
  return [text.slice(0, breakAt), text.slice(breakAt + 1)];
}

function SpeakerIcon({ cx, cy, size = 14 }: { cx: number; cy: number; size?: number }) {
  const s = size / 2;
  return (
    <g>
      <circle cx={cx} cy={cy} r={s + 2} fill="#6366f1" opacity={0.9} />
      {/* Speaker body */}
      <rect x={cx - 3} y={cy - 3} width={4} height={6} rx={0.5} fill="#e0e7ff" />
      <polygon points={`${cx + 1},${cy - 4} ${cx + 5},${cy - 6} ${cx + 5},${cy + 6} ${cx + 1},${cy + 4}`} fill="#e0e7ff" />
      {/* Sound waves */}
      <path d={`M${cx + 6},${cy - 3} Q${cx + 9},${cy} ${cx + 6},${cy + 3}`} fill="none" stroke="#a5b4fc" strokeWidth={1} />
      <path d={`M${cx + 8},${cy - 5} Q${cx + 12},${cy} ${cx + 8},${cy + 5}`} fill="none" stroke="#a5b4fc" strokeWidth={0.8} opacity={0.7} />
    </g>
  );
}

export function ConceptNode({
  concept,
  x,
  y,
  isCenter,
  isActivated,
  explanation,
  onClick,
  onActivate,
  animate = true,
}: ConceptNodeProps) {
  const [hovered, setHovered] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [pulse, setPulse] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (animate && !mountedRef.current) {
      mountedRef.current = true;
      setTimeout(() => setPulse(true), 100);
      setTimeout(() => setPulse(false), 600);
    }
  }, [animate]);

  if (isCenter) {
    const r = 42;
    return (
      <g
        style={{
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: `translate(${x}px, ${y}px)`,
        }}
      >
        <circle r={r + 18} fill="none" stroke="#818cf8" strokeWidth={1} opacity={0.15} className="animate-pulse-soft" />
        <circle r={r + 10} fill="none" stroke="#818cf8" strokeWidth={1} opacity={0.25} />
        <circle r={r} fill="url(#centerGrad)" stroke="#818cf8" strokeWidth={2.5} />
        <circle r={r - 10} fill="#4f46e5" opacity={0.4} />
        <text textAnchor="middle" dy="0.35em" fill="#e0e7ff" fontSize={22} fontWeight="700" className="pointer-events-none select-none">
          {concept.label.charAt(0)}
        </text>
        <text textAnchor="middle" dy={r + 18} fill="#f1f5f9" fontSize={13} fontWeight="600" className="pointer-events-none select-none">
          {concept.label}
        </text>
        <text textAnchor="middle" dy={r + 32} fill="#64748b" fontSize={9} className="pointer-events-none select-none">
          {concept.domain}
        </text>

        {/* Speaker for center node */}
        <g
          onClick={(e) => {
            e.stopPropagation();
            setSpeaking(true);
            speak(`${concept.label}: ${concept.description}`);
            setTimeout(() => setSpeaking(false), 1500);
          }}
          className="cursor-pointer"
          style={{ cursor: 'pointer' }}
        >
          <SpeakerIcon cx={r + 18} cy={-r + 6} size={speaking ? 16 : 14} />
        </g>
      </g>
    );
  }

  const r = 26;
  const angle = Math.atan2(y - RING_CENTER.y, x - RING_CENTER.x);
  const labelBelow = angle >= -Math.PI / 2 && angle <= Math.PI / 2;
  const labelDy = labelBelow ? r + 14 : -(r + 10);

  const tipAbove = labelBelow;
  const tipBoxH = 34;
  const tipBoxW = 200;
  const tipGap = 8;
  const tipY = tipAbove ? -(r + tipGap + tipBoxH) : (r + tipGap);
  const tipTextY = tipAbove ? tipY + 14 : tipY + 14;

  const [line1, line2] = splitExplanation(explanation);

  // Activate button — opposite side from tooltip to avoid overlap
  const actX = r + 2;
  const actY = labelBelow ? (r + 2) : -(r + 2);

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: `translate(${x}px, ${y}px)`,
        cursor: 'pointer',
      }}
    >
      {/* Large invisible hover hit area — bridges gaps between children */}
      <circle r={r + 18} fill="transparent" />

      {/* Pulse ring */}
      {pulse && (
        <circle r={r + 10} fill="none" stroke="#6366f1" strokeWidth={2} className="animate-ping-soft" opacity={0.4} />
      )}

      {/* Connection line */}
      <line
        x1={0}
        y1={0}
        x2={RING_CENTER.x - x}
        y2={RING_CENTER.y - y}
        stroke={isActivated ? '#6366f1' : '#1e293b'}
        strokeWidth={isActivated ? 1.5 : 0.8}
        strokeDasharray={isActivated ? 'none' : '6,5'}
        opacity={hovered ? 0.5 : 0.25}
        className={isActivated ? '' : 'animate-line-flow'}
        style={{ transition: 'opacity 0.3s, stroke 0.3s' }}
      />

      {/* Node circle */}
      <circle
        r={r}
        fill={isActivated ? '#1e293b' : hovered ? '#1e293b' : '#0f172a'}
        stroke={isActivated ? '#6366f1' : hovered ? '#475569' : '#1e293b'}
        strokeWidth={isActivated ? 2.5 : 1.5}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{ transition: 'fill 0.2s, stroke 0.2s' }}
      />

      {/* Label */}
      <text
        textAnchor="middle"
        dy={labelDy}
        fill={hovered ? '#f1f5f9' : '#94a3b8'}
        fontSize={10}
        fontWeight={hovered ? '500' : '400'}
        className="pointer-events-none select-none"
        style={{ transition: 'fill 0.2s' }}
      >
        {concept.label.length > 15 ? concept.label.slice(0, 14) + '…' : concept.label}
      </text>

      {/* Activated dot */}
      {isActivated && (
        <circle cx={r - 4} cy={-(r - 4)} r={3.5} fill="#22c55e" className="animate-pulse-soft" />
      )}

      {/* Activate (+) button */}
      {hovered && !isActivated && (
        <g onClick={(e) => { e.stopPropagation(); onActivate(); }} className="cursor-pointer">
          <circle cx={actX} cy={actY} r={8} fill="#22c55e" opacity={0.9} />
          <text x={actX} y={actY} textAnchor="middle" dy="0.35em" fill="#0f172a" fontSize={11} fontWeight="bold" className="pointer-events-none select-none">
            +
          </text>
        </g>
      )}

      {/* Tooltip — pointer-events none so it doesn't block the + button */}
      {hovered && line1 && (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={-tipBoxW / 2}
            y={tipY}
            width={tipBoxW}
            height={tipBoxH}
            rx={6}
            fill="#1e293b"
            stroke="#334155"
            strokeWidth={1}
            opacity={0.96}
          />
          <text
            textAnchor="middle"
            x={0}
            y={tipTextY}
            fill="#94a3b8"
            fontSize={9.5}
            className="pointer-events-none select-none"
          >
            <tspan x="0" dy="0">{line1}</tspan>
            {line2 && <tspan x="0" dy="14">{line2}</tspan>}
          </text>
        </g>
      )}
    </g>
  );
}
