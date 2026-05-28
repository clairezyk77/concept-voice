import type { Concept, Relation, RelationType } from '../types/concept.ts';

type GrammarRule = (concept: Concept, _pool: Concept[], allRelations: Relation[]) => Relation[];

const hierarchy: GrammarRule = (concept, _pool, relations) => {
  return relations.filter(
    (r) =>
      (r.sourceId === concept.id || r.targetId === concept.id) && r.type === 'hierarchy',
  );
};

const neighborhood: GrammarRule = (concept, _pool, relations) => {
  const pool = _pool;
  const domainConcepts = pool.filter((c) => c.id !== concept.id && c.domain === concept.domain);
  const domainIds = new Set(domainConcepts.map((c) => c.id));
  return relations.filter(
    (r) =>
      (r.sourceId === concept.id || r.targetId === concept.id) &&
      r.type === 'neighborhood',
  ).concat(
    domainConcepts
      .filter((c) => {
        const hasRelation = relations.some(
          (r) =>
            (r.sourceId === concept.id && r.targetId === c.id) ||
            (r.targetId === concept.id && r.sourceId === c.id),
        );
        return !hasRelation && domainIds.has(c.id);
      })
      .map((c) => ({
        sourceId: concept.id,
        targetId: c.id,
        type: 'neighborhood' as RelationType,
        strength: 0.3,
      })),
  );
};

const bridge: GrammarRule = (concept, _pool, relations) => {
  return relations.filter(
    (r) =>
      (r.sourceId === concept.id || r.targetId === concept.id) && r.type === 'bridge',
  );
};

const process: GrammarRule = (concept, _pool, relations) => {
  return relations.filter(
    (r) =>
      (r.sourceId === concept.id || r.targetId === concept.id) && r.type === 'process',
  );
};

const composition: GrammarRule = (concept, _pool, relations) => {
  return relations.filter(
    (r) =>
      (r.sourceId === concept.id || r.targetId === concept.id) && r.type === 'composition',
  );
};

const contrast: GrammarRule = (concept, _pool, relations) => {
  return relations.filter(
    (r) =>
      (r.sourceId === concept.id || r.targetId === concept.id) && r.type === 'contrast',
  );
};

export const grammarRules: Record<RelationType, GrammarRule> = {
  hierarchy,
  neighborhood,
  bridge,
  process,
  composition,
  contrast,
};

export function getRelatedConcepts(
  conceptId: string,
  pool: { concepts: Concept[]; relations: Relation[] },
): Relation[] {
  return pool.relations.filter(
    (r) => r.sourceId === conceptId || r.targetId === conceptId,
  );
}

export function getRelatedByType(
  conceptId: string,
  type: RelationType,
  relations: Relation[],
): Relation[] {
  return relations.filter(
    (r) =>
      (r.sourceId === conceptId || r.targetId === conceptId) && r.type === type,
  );
}

export function getNeighborIds(
  conceptId: string,
  relations: Relation[],
): string[] {
  const ids = new Set<string>();
  for (const r of relations) {
    if (r.sourceId === conceptId) ids.add(r.targetId);
    if (r.targetId === conceptId) ids.add(r.sourceId);
  }
  return Array.from(ids);
}
