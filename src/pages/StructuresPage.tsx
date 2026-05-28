import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConceptSpace } from '../store/ConceptSpaceContext.tsx';
import { useUserKnowledge } from '../store/UserKnowledgeContext.tsx';
import { detectStructures, hintToStructure } from '../engine/structureDetection.ts';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';

export function StructuresPage() {
  const navigate = useNavigate();
  const { pool } = useConceptSpace();
  const { knowledge, updateKnowledge } = useUserKnowledge();

  const hints = useMemo(
    () => detectStructures(knowledge, pool),
    [knowledge, pool],
  );

  const handleGenerateStructure = (hint: (typeof hints)[0]) => {
    const structure = hintToStructure(hint, pool);
    updateKnowledge((prev) => ({
      ...prev,
      structures: [...prev.structures, structure],
    }));
  };

  if (hints.length === 0 && knowledge.structures.length === 0) {
    return (
      <EmptyState
        title="No structures detected"
        description="Activate concepts across different domains to discover emerging structures"
        action={{ label: 'Explore concepts', onClick: () => navigate('/concept-space') }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 page-enter">
      <h2 className="mb-1 text-xl font-semibold text-slate-100">Structure Synthesis</h2>
      <p className="mb-6 text-sm text-slate-500">
        Discover cross-domain connections in your knowledge
      </p>

      {/* Emerging structures */}
      {hints.length > 0 && (
        <section className="mb-8 animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse-soft" />
            <h3 className="text-sm font-medium text-slate-400">Structure Emerging</h3>
            <Badge label={`${hints.length} detected`} variant="warning" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 animate-stagger">
            {hints.map((hint, i) => (
              <Card key={i} className="border-amber-500/20 hover:border-amber-500/30 transition-all duration-200">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {hint.domains.map((d) => (
                        <Badge key={d} label={d} variant="warning" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-300 mb-3">
                      Shared concept connects {hint.domains.length} domains
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {hint.involvedConceptIds.map((id) => {
                        const c = pool.concepts.find((x) => x.id === id);
                        return (
                          <span
                            key={id}
                            className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300 border border-cyan-500/20"
                          >
                            {c?.label ?? id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-auto self-start"
                    onClick={() => handleGenerateStructure(hint)}
                  >
                    Generate Structure
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Saved structures */}
      {knowledge.structures.length > 0 && (
        <section className="animate-fade-in">
          <h3 className="mb-3 text-sm font-medium text-slate-400">
            Saved Structures ({knowledge.structures.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 animate-stagger">
            {knowledge.structures.slice().reverse().map((s) => (
              <Card key={s.id} className="border-indigo-500/10 hover:border-indigo-500/20 transition-all duration-200">
                <p className="font-medium text-slate-200">{s.label}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.conceptIds.map((id) => {
                    const c = pool.concepts.find((x) => x.id === id);
                    return (
                      <span
                        key={id}
                        className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300"
                      >
                        {c?.label ?? id}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {new Date(s.detectedAt).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
