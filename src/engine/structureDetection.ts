import type { SeedPool } from '../types/concept.ts';
import type { UserKnowledge, SynthesizedStructure } from '../types/user.ts';
import type { StructureHint } from '../types/engine.ts';

const CROSS_DOMAIN_THRESHOLD = 2;

/**
 * Detect emerging structures: concepts that are activated across multiple domains.
 */
export function detectStructures(
  knowledge: UserKnowledge,
  pool: SeedPool,
): StructureHint[] {
  const conceptMap = new Map(pool.concepts.map((c) => [c.id, c]));
  const activeConcepts = Object.keys(knowledge.activations);

  // Group active concepts by domain
  const domainGroups = new Map<string, Set<string>>();
  for (const conceptId of activeConcepts) {
    const c = conceptMap.get(conceptId);
    if (!c) continue;
    if (!domainGroups.has(c.domain)) {
      domainGroups.set(c.domain, new Set());
    }
    domainGroups.get(c.domain)!.add(conceptId);
  }

  // Find concepts that appear in multiple domains
  const hints: StructureHint[] = [];

  for (const [conceptId, activation] of Object.entries(knowledge.activations)) {
    const c = conceptMap.get(conceptId);
    if (!c || activation.strength < 0.3) continue;

    // Find which domains this concept connects to
    const connectedDomains: string[] = [];
    const involvedConcepts: string[] = [conceptId];

    for (const [domain, concepts] of domainGroups) {
      if (domain === c.domain) continue;
      if (concepts.has(conceptId)) {
        connectedDomains.push(domain);
      } else {
        // Check if any relation connects this concept to the domain
        const hasRelation = pool.relations.some(
          (r) =>
            (r.sourceId === conceptId && concepts.has(r.targetId)) ||
            (r.targetId === conceptId && concepts.has(r.sourceId)),
        );
        if (hasRelation) {
          connectedDomains.push(domain);
          // Add one concept from that domain
          involvedConcepts.push(Array.from(concepts)[0]);
        }
      }
    }

    if (connectedDomains.length >= CROSS_DOMAIN_THRESHOLD) {
      hints.push({
        sharedConceptId: conceptId,
        involvedConceptIds: involvedConcepts,
        domains: [c.domain, ...connectedDomains],
        score: activation.strength * connectedDomains.length,
      });
    }
  }

  // Also check user connections across domains
  for (const conn of knowledge.connections) {
    const source = conceptMap.get(conn.sourceId);
    const target = conceptMap.get(conn.targetId);
    if (source && target && source.domain !== target.domain) {
      const existing = hints.find(
        (h) =>
          h.sharedConceptId === conn.sourceId || h.sharedConceptId === conn.targetId,
      );
      if (!existing) {
        hints.push({
          sharedConceptId: conn.sourceId,
          involvedConceptIds: [conn.sourceId, conn.targetId],
          domains: [source.domain, target.domain],
          score: 0.5,
        });
      }
    }
  }

  return hints.sort((a, b) => b.score - a.score);
}

/**
 * Generate a label for a structure based on its member concepts.
 */
export function generateStructureLabel(
  structure: StructureHint,
  pool: SeedPool,
): string {
  const conceptMap = new Map(pool.concepts.map((c) => [c.id, c]));
  const shared = conceptMap.get(structure.sharedConceptId);
  const domains = [...new Set(structure.domains)];

  if (shared) {
    return `${shared.label} across ${domains.join(' + ')}`;
  }
  return `Structure: ${domains.join(' + ')}`;
}

/**
 * Convert a StructureHint to a SynthesizedStructure for persistence.
 */
export function hintToStructure(
  hint: StructureHint,
  pool: SeedPool,
): SynthesizedStructure {
  return {
    id: `struct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conceptIds: hint.involvedConceptIds,
    label: generateStructureLabel(hint, pool),
    detectedAt: Date.now(),
    merged: false,
  };
}
