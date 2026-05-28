import { useUserKnowledge } from '../store/UserKnowledgeContext.tsx';
import { useConceptSpace } from '../store/ConceptSpaceContext.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export function KnowledgePage() {
  const navigate = useNavigate();
  const { knowledge } = useUserKnowledge();
  const { pool } = useConceptSpace();
  const conceptMap = useMemo(
    () => new Map(pool.concepts.map((c) => [c.id, c])),
    [pool.concepts],
  );

  const activatedList = useMemo(
    () =>
      Object.entries(knowledge.activations)
        .sort(([, a], [, b]) => b.strength - a.strength)
        .map(([id, act]) => ({
          concept: conceptMap.get(id),
          activation: act,
        }))
        .filter((x) => x.concept),
    [knowledge.activations, conceptMap],
  );

  const totalStrength = useMemo(
    () => activatedList.reduce((sum, a) => sum + a.activation.strength, 0),
    [activatedList],
  );

  if (activatedList.length === 0) {
    return (
      <EmptyState
        title="No knowledge yet"
        description="Activate concepts in Concept Space to build your knowledge graph"
        action={{ label: 'Go to Concept Space', onClick: () => navigate('/concept-space') }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 page-enter">
      {/* Header stats */}
      <div className="mb-8">
        <h2 className="mb-1 text-xl font-semibold text-slate-100">Your Knowledge</h2>
        <p className="text-sm text-slate-500">
          {activatedList.length} concepts activated · {Math.round(totalStrength * 100)}% total strength
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-4 gap-3">
        {[
          { label: 'Activated', value: activatedList.length, color: 'text-indigo-400' },
          { label: 'Connections', value: knowledge.connections.length, color: 'text-cyan-400' },
          { label: 'Paths', value: knowledge.paths.length, color: 'text-green-400' },
          { label: 'Structures', value: knowledge.structures.length, color: 'text-amber-400' },
        ].map((stat) => (
          <Card key={stat.label} className="text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Activation map */}
      <section className="mb-8 animate-fade-in">
        <h3 className="mb-3 text-sm font-medium text-slate-400">Activated Concepts</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
          {activatedList.map(({ concept, activation }) => (
            <Card key={concept!.id} className="group hover:border-indigo-500/20 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {concept!.label}
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">{concept!.domain}</p>
                </div>
                <Badge
                  label={`${Math.round(activation.strength * 100)}%`}
                  variant={activation.strength > 0.7 ? 'success' : activation.strength > 0.4 ? 'warning' : 'default'}
                />
              </div>
              {/* Strength bar */}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-700/50">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${activation.strength * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                Visited {activation.visitCount} time{activation.visitCount > 1 ? 's' : ''}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Connections */}
      {knowledge.connections.length > 0 && (
        <section className="mb-8 animate-fade-in">
          <h3 className="mb-3 text-sm font-medium text-slate-400">Connections</h3>
          <div className="space-y-2">
            {knowledge.connections.map((conn, i) => {
              const s = conceptMap.get(conn.sourceId);
              const t = conceptMap.get(conn.targetId);
              return (
                <Card key={i} className="flex items-center gap-3">
                  <Badge label={s?.label ?? conn.sourceId} variant="primary" />
                  <span className="text-xs text-slate-600">{conn.type}</span>
                  <Badge label={t?.label ?? conn.targetId} variant="primary" />
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Paths */}
      {knowledge.paths.length > 0 && (
        <section className="mb-8 animate-fade-in">
          <h3 className="mb-3 text-sm font-medium text-slate-400">Exploration Paths</h3>
          <div className="space-y-2">
            {knowledge.paths.slice().reverse().map((path) => (
              <Card key={path.id}>
                <div className="flex flex-wrap items-center gap-1 text-sm text-slate-300">
                  {path.steps.map((step, i) => {
                    const c = conceptMap.get(step.conceptId);
                    return (
                      <span key={step.conceptId} className="flex items-center">
                        {i > 0 && (
                          <span className="mx-1.5 text-slate-600 text-xs">→</span>
                        )}
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                          {c?.label ?? step.conceptId}
                        </span>
                      </span>
                    );
                  })}
                </div>
                {path.steps.length > 1 && (
                  <p className="mt-1.5 text-xs text-slate-600">
                    {path.steps.length} steps
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Questions */}
      {knowledge.questions.length > 0 && (
        <section className="animate-fade-in">
          <h3 className="mb-3 text-sm font-medium text-slate-400">Questions</h3>
          <div className="space-y-2">
            {knowledge.questions.map((q, i) => (
              <Card key={i}>
                <p className="text-sm text-slate-300">"{q}"</p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
