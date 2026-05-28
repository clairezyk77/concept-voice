import { useMemo } from 'react';
import type { ScoredConcept } from '../types/engine.ts';

export interface RingPosition {
  conceptId: string;
  x: number;
  y: number;
  angle: number;
  score: number;
  explanation: string;
}

export const RING_CENTER = { x: 500, y: 350 };
export const RING_RADIUS = 260;

/**
 * Compute radial positions for neighbor concepts around center.
 */
export function useConceptRing(
  centerId: string | null,
  neighbors: ScoredConcept[],
  explanations: string[],
): RingPosition[] {
  return useMemo(() => {
    if (!centerId || neighbors.length === 0) return [];

    const count = neighbors.length;
    const { x: cx, y: cy } = RING_CENTER;

    return neighbors.map((n, i) => {
      // Spread evenly, offset so first node is at top
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      return {
        conceptId: n.conceptId,
        x: cx + RING_RADIUS * Math.cos(angle),
        y: cy + RING_RADIUS * Math.sin(angle),
        angle,
        score: n.score,
        explanation: explanations[i] ?? '',
      };
    });
  }, [centerId, neighbors, explanations]);
}
