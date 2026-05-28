import type { Concept, SeedPool } from '../types/concept.ts';
import type {
  DensityParams,
  RecommendationRequest,
  RecommendationResult,
  ScoredConcept,
} from '../types/engine.ts';
import { grammarRules } from './conceptGrammar.ts';
import { applyDensityFilter } from './densityEngine.ts';

const RELATION_WEIGHTS: Record<string, number> = {
  hierarchy: 1.0,
  composition: 0.9,
  process: 0.8,
  neighborhood: 0.6,
  bridge: 0.7,
  contrast: 0.5,
};

type ExplainFn = (neighbor: string, center: string, centerIsSource: boolean) => string;

const EXPLANATION_TEMPLATES: Record<string, ExplainFn> = {
  hierarchy: (n, c, cis) => cis ? `${n} is a type of ${c}` : `${c} is a type of ${n}`,
  neighborhood: (n, c) => `${n} is related to ${c} in the same domain`,
  bridge: (n, c) => `${n} connects different domains with ${c}`,
  process: (n, c, cis) => cis ? `${c} leads to or enables ${n}` : `${n} leads to or enables ${c}`,
  composition: (n, c, cis) => cis ? `${n} is a component of ${c}` : `${c} is a component of ${n}`,
  contrast: (n, c) => `${n} contrasts with ${c}`,
};

export function recommendNeighbors(
  request: RecommendationRequest,
  pool: SeedPool,
  params: DensityParams,
): RecommendationResult {
  const { centerConceptId, activatedIds, bannedIds } = request;
  const conceptMap = new Map(pool.concepts.map((c) => [c.id, c]));
  const center = conceptMap.get(centerConceptId);
  if (!center) return { neighbors: [], explanations: [] };

  // Collect candidates from all grammar rules
  const scored = new Map<string, ScoredConcept>();
  const relationTypes = Object.keys(grammarRules) as (keyof typeof grammarRules)[];

  for (const type of relationTypes) {
    const rule = grammarRules[type];
    const relations = rule(center, pool.concepts, pool.relations);
    for (const rel of relations) {
      const neighborId = rel.sourceId === centerConceptId ? rel.targetId : rel.sourceId;
      if (bannedIds.has(neighborId)) continue;
      if (neighborId === centerConceptId) continue;

      const existing = scored.get(neighborId);
      const weight = RELATION_WEIGHTS[type] || 0.5;
      const score = rel.strength * weight + (activatedIds.has(neighborId) ? 0.2 : 0);

      if (!existing || score > existing.score) {
        scored.set(neighborId, {
          conceptId: neighborId,
          score,
          relationType: type,
          relationStrength: rel.strength,
          centerIsSource: rel.sourceId === centerConceptId,
        });
      }
    }
  }

  // Sort by score
  const sorted = Array.from(scored.values()).sort((a, b) => b.score - a.score);

  // Apply density filter
  const filtered = applyDensityFilter(
    sorted.map((s) => s.conceptId),
    center.domain,
    conceptMap as Map<string, { id: string; domain: string }>,
    params,
  );

  // Re-sort filtered by original score
  const result = filtered
    .map((id) => scored.get(id)!)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  // Generate explanations
  const explanations = result.map((s) => {
    const neighbor = conceptMap.get(s.conceptId);
    const template = EXPLANATION_TEMPLATES[s.relationType];
    if (template && neighbor) {
      return template(neighbor.label, center.label, s.centerIsSource);
    }
    return `${neighbor?.label ?? s.conceptId} is related to ${center.label}`;
  });

  return { neighbors: result, explanations };
}

export function generateExplanation(
  conceptA: Concept,
  conceptB: Concept,
  relationType: string,
  centerIsSource = true,
): string {
  const template = EXPLANATION_TEMPLATES[relationType];
  if (template) {
    return template(conceptA.label, conceptB.label, centerIsSource);
  }
  return `${conceptA.label} and ${conceptB.label} are related`;
}
