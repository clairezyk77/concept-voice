import type { DensityParams } from '../types/engine.ts';

export const DEFAULT_DENSITY: DensityParams = {
  localDensity: 0.5,
  refreshExpansion: 0.3,
  crossDomainDrift: 0.3,
  deepLayerDensity: 0.5,
};

/**
 * Compute how "local" (same-domain) the neighborhood should be.
 * 0 = all cross-domain, 1 = all same-domain.
 */
export function computeLocalThreshold(params: DensityParams): number {
  return 0.3 + params.localDensity * 0.7;
}

/**
 * Compute how far a refresh should jump from the current center.
 * 0 = minimal jump, 1 = maximum jump (different domain).
 */
export function computeRefreshJump(params: DensityParams): number {
  return params.refreshExpansion;
}

/**
 * Compute proportion of cross-domain concepts in the ring.
 */
export function computeCrossDomainRatio(params: DensityParams): number {
  return 0.1 + params.crossDomainDrift * 0.6;
}

/**
 * Compute how deep (multi-hop) the expansion should go.
 * 0 = direct neighbors only, 1 = up to 3 hops.
 */
export function computeDeepLayerHops(params: DensityParams): number {
  return Math.max(1, Math.round(1 + params.deepLayerDensity * 2));
}

/**
 * Filter a set of candidate neighbor IDs based on density params and current center.
 */
export function applyDensityFilter(
  candidateIds: string[],
  centerDomain: string,
  conceptsById: Map<string, { id: string; domain: string }>,
  params: DensityParams,
): string[] {
  const threshold = computeLocalThreshold(params);
  const crossRatio = computeCrossDomainRatio(params);

  const sameDomain: string[] = [];
  const crossDomain: string[] = [];

  for (const id of candidateIds) {
    const c = conceptsById.get(id);
    if (!c) continue;
    if (c.domain === centerDomain) {
      sameDomain.push(id);
    } else {
      crossDomain.push(id);
    }
  }

  const totalSlots = 12;
  const crossCount = Math.round(totalSlots * crossRatio);
  const localCount = totalSlots - crossCount;

  const shuffled = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const selected = new Set<string>();

  // Pick local concepts, weighted by threshold
  const localPick = Math.min(localCount, Math.round(sameDomain.length * threshold));
  for (const id of shuffled(sameDomain).slice(0, Math.max(localPick, 1))) {
    selected.add(id);
  }

  // Pick cross-domain concepts
  for (const id of shuffled(crossDomain).slice(0, crossCount)) {
    selected.add(id);
  }

  // Fill remaining slots with whatever's left
  if (selected.size < 8) {
    const remaining = shuffled(candidateIds).filter((id) => !selected.has(id));
    for (const id of remaining) {
      if (selected.size >= 12) break;
      selected.add(id);
    }
  }

  return Array.from(selected);
}
