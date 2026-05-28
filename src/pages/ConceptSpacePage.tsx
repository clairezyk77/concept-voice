import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConceptSpace } from '../store/ConceptSpaceContext.tsx';
import { ConceptGraph } from '../components/space/ConceptGraph.tsx';
import { CenterConcept } from '../components/space/CenterConcept.tsx';
import { ConceptActions } from '../components/space/ConceptActions.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';

export function ConceptSpacePage() {
  const navigate = useNavigate();
  const { space, pool } = useConceptSpace();
  const { centerId, neighbors } = space;

  const centerConcept = useMemo(
    () => pool.concepts.find((c) => c.id === centerId) ?? null,
    [centerId, pool.concepts],
  );

  if (!centerConcept) {
    return (
      <EmptyState
        title="No concept selected"
        description="Start from the Entry page to explore concepts"
        action={{ label: 'Go to Entry', onClick: () => navigate('/') }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col page-enter">
      {/* Header — sticky top */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-slate-700/30 bg-slate-900/90 px-6 py-3 backdrop-blur-md">
        <CenterConcept concept={centerConcept} />
      </div>

      {/* Graph area — fills remaining space, no page scroll */}
      <div className="relative min-h-0 flex-1">
        <ConceptGraph
          centerId={centerId!}
          neighbors={neighbors.neighbors}
          explanations={neighbors.explanations}
        />
      </div>

      {/* Actions bar — sticky bottom */}
      <div className="sticky bottom-0 z-10 shrink-0 border-t border-slate-700/30 bg-slate-900/90 px-6 py-2.5 backdrop-blur-md">
        <ConceptActions />
      </div>
    </div>
  );
}
