import { useMemo, useEffect, useState } from 'react';
import type { ScoredConcept } from '../../types/engine.ts';
import { useConceptSpace } from '../../store/ConceptSpaceContext.tsx';
import { useUserKnowledge } from '../../store/UserKnowledgeContext.tsx';
import { useExploration } from '../../hooks/useExploration.ts';
import { useConceptRing, RING_CENTER } from '../../hooks/useConceptRing.ts';
import { ConceptRing } from './ConceptRing.tsx';
import { ConceptNode } from './ConceptNode.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';

interface ConceptGraphProps {
  centerId: string;
  neighbors: ScoredConcept[];
  explanations: string[];
}

export function ConceptGraph({ centerId, neighbors, explanations }: ConceptGraphProps) {
  const { pool } = useConceptSpace();
  const { isActivated } = useUserKnowledge();
  const { navigateTo, handleActivate } = useExploration();
  const [transitioning, setTransitioning] = useState(false);

  const centerConcept = useMemo(
    () => pool.concepts.find((c) => c.id === centerId),
    [pool.concepts, centerId],
  );

  const neighborConcepts = useMemo(() => {
    const map = new Map(pool.concepts.map((c) => [c.id, c]));
    return neighbors.map((n) => map.get(n.conceptId)).filter(Boolean);
  }, [pool.concepts, neighbors]);

  const positions = useConceptRing(centerId, neighbors, explanations);

  // Animate transition when center changes
  useEffect(() => {
    setTransitioning(true);
    const t = setTimeout(() => setTransitioning(false), 600);
    return () => clearTimeout(t);
  }, [centerId]);

  if (!centerConcept) {
    return <EmptyState title="Concept not found" description="The selected concept could not be found in the pool" />;
  }

  return (
    <div className="relative h-full w-full">
      {/* Overlay info */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2">
        <span className="rounded-lg bg-slate-900/60 px-2.5 py-1 text-xs text-slate-500 backdrop-blur-sm border border-slate-700/30">
          {neighbors.length} neighbors
        </span>
        <span className="rounded-lg bg-slate-900/60 px-2.5 py-1 text-xs text-slate-500 backdrop-blur-sm border border-slate-700/30">
          click a node to navigate
        </span>
      </div>

      {/* Domain badge */}
      <div className="pointer-events-none absolute right-4 top-4 z-10">
        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300 border border-indigo-500/20 backdrop-blur-sm">
          {centerConcept.domain}
        </span>
      </div>

      {/* Transition overlay */}
      {transitioning && (
        <div className="pointer-events-none absolute inset-0 z-5">
          <div className="h-full w-full bg-gradient-to-b from-indigo-500/5 to-transparent opacity-60 transition-opacity duration-500" />
        </div>
      )}

      <ConceptRing>
        <defs>
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </radialGradient>
        </defs>

        {/* Center */}
        <ConceptNode
          concept={centerConcept}
          x={RING_CENTER.x}
          y={RING_CENTER.y}
          isCenter={true}
          isActivated={true}
          explanation=""
          onClick={() => {}}
          onActivate={() => {}}
          animate={false}
        />

        {/* Neighbors */}
        {positions.map((pos, i) => {
          const concept = neighborConcepts[i];
          if (!concept) return null;
          return (
            <ConceptNode
              key={concept.id}
              concept={concept}
              x={pos.x}
              y={pos.y}
              isCenter={false}
              isActivated={isActivated(concept.id)}
              explanation={pos.explanation}
              onClick={() => navigateTo(concept.id)}
              onActivate={() => handleActivate(concept.id)}
              animate={true}
            />
          );
        })}
      </ConceptRing>
    </div>
  );
}
