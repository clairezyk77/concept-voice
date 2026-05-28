import type { Concept, SeedPool } from '../types/concept.ts';
import type { EntryResult } from '../types/engine.ts';

export type EntryType = 'question' | 'theme' | 'discipline' | 'conversation';

/**
 * Generate initial concepts based on user input.
 * Uses keyword matching against concept labels, descriptions, and domains.
 */
export function generateFromEntry(
  input: string,
  type: EntryType,
  pool: SeedPool,
): EntryResult {
  const query = input.toLowerCase();

  // Find all domains that match the query
  const queryMatchedDomains = new Set(
    pool.concepts
      .filter((c) => c.domain.toLowerCase().includes(query) && query.length >= 2)
      .map((c) => c.domain),
  );

  // Score concepts by relevance
  const scored = pool.concepts.map((c) => ({
    concept: c,
    score: scoreRelevance(c, query, type),
  }));

  // Sort by score descending
  const sorted = scored.sort((a, b) => b.score - a.score);
  const count = Math.min(Math.max(6, Math.ceil(sorted.length * 0.15)), 10);
  const top = sorted.slice(0, count);

  let conceptIds = top.map((s) => s.concept.id);

  // If query matches a domain, ensure at least 4 concepts from that domain appear
  if (queryMatchedDomains.size > 0) {
    const domainConcepts = pool.concepts
      .filter((c) => queryMatchedDomains.has(c.domain))
      .map((c) => c.id);
    const existing = new Set(conceptIds);
    const missing = domainConcepts.filter((id) => !existing.has(id));
    if (missing.length > 0) {
      // Replace lowest-ranked non-domain concepts with domain concepts
      const nonDomain = top.filter((s) => !queryMatchedDomains.has(s.concept.domain));
      const slots = Math.min(missing.length, Math.max(2, Math.ceil(count * 0.4)));
      const keep = nonDomain.slice(0, nonDomain.length - Math.min(slots, nonDomain.length));
      const add = missing.slice(0, slots);
      conceptIds = [...keep.map((s) => s.concept.id), ...add];
    }
  }

  // Generate suggestions based on matched domains
  const matchedDomains = new Set(top.map((s) => s.concept.domain));
  const suggestions = Array.from(matchedDomains).map(
    (domain) => `Explore more in ${domain}`,
  );

  if (suggestions.length === 0) {
    suggestions.push('Try a different topic or keyword');
  }

  return { concepts: conceptIds, suggestions };
}

function scoreRelevance(concept: Concept, query: string, _type: EntryType): number {
  let score = 0;

  // Direct label match (highest)
  if (concept.label.toLowerCase().includes(query)) {
    score += 10;
  }

  // Description match
  if (concept.description.toLowerCase().includes(query)) {
    score += 5;
  }

  // Domain match (high boost to surface domain-relevant concepts)
  if (concept.domain.toLowerCase().includes(query)) {
    score += 8;
  }

  // Boost core concepts
  if (concept.type === 'core') {
    score += 1;
  }

  // Token-level matching
  const queryTokens = query.split(/\s+/);
  for (const token of queryTokens) {
    if (token.length < 2) continue;
    if (concept.label.toLowerCase().includes(token)) score += 4;
    if (concept.description.toLowerCase().includes(token)) score += 2;
    if (concept.domain.toLowerCase().includes(token)) score += 1;
  }

  return score;
}
