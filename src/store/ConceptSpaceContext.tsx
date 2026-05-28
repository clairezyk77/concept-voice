import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import seedPoolData from '../../data/seed-pool.json';
import type { SeedPool } from '../types/concept.ts';
import { recommendNeighbors } from '../engine/recommendation.ts';
import type { DensityParams, RecommendationResult } from '../types/engine.ts';
import { DEFAULT_DENSITY } from '../engine/densityEngine.ts';
import { useUserKnowledge } from './UserKnowledgeContext.tsx';

const builtInPool = seedPoolData as SeedPool;

interface ConceptSpaceState {
  centerId: string | null;
  neighbors: RecommendationResult;
  density: DensityParams;
  previousCenterIds: string[];
}

interface ConceptSpaceContextValue {
  space: ConceptSpaceState;
  setCenter: (conceptId: string) => void;
  refresh: () => void;
  expand: () => void;
  updateDensity: (params: Partial<DensityParams>) => void;
  goBack: () => void;
  pool: SeedPool;
}

const emptyResult: RecommendationResult = { neighbors: [], explanations: [] };

const ConceptSpaceContext = createContext<ConceptSpaceContextValue | null>(null);

export function ConceptSpaceProvider({ children }: { children: ReactNode }) {
  const { knowledge } = useUserKnowledge();

  // Merge built-in seed pool with user-imported domains
  const pool = useMemo<SeedPool>(() => {
    const imported = Object.values(knowledge.importedDomains);
    if (imported.length === 0) return builtInPool;

    const seenIds = new Set(builtInPool.concepts.map((c) => c.id));
    return {
      concepts: [
        ...builtInPool.concepts,
        ...imported.flatMap((d) => d.concepts).filter((c) => !seenIds.has(c.id) && seenIds.add(c.id)),
      ],
      relations: [
        ...builtInPool.relations,
        ...imported.flatMap((d) => d.relations),
      ],
    };
  }, [knowledge.importedDomains]);

  const [space, setSpace] = useState<ConceptSpaceState>({
    centerId: null,
    neighbors: emptyResult,
    density: { ...DEFAULT_DENSITY },
    previousCenterIds: [],
  });

  const computeNeighbors = useCallback(
    (centerId: string, density: DensityParams): RecommendationResult => {
      const activatedIds = new Set(Object.keys(knowledge.activations));
      const bannedIds = new Set(knowledge.bannedConceptIds);
      return recommendNeighbors(
        {
          centerConceptId: centerId,
          activatedIds,
          bannedIds,
          density,
        },
        pool,
        density,
      );
    },
    [knowledge.activations, knowledge.bannedConceptIds],
  );

  const setCenter = useCallback(
    (conceptId: string) => {
      setSpace((prev) => ({
        ...prev,
        centerId: conceptId,
        previousCenterIds: prev.centerId
          ? [...prev.previousCenterIds, prev.centerId]
          : prev.previousCenterIds,
        neighbors: computeNeighbors(conceptId, prev.density),
      }));
    },
    [computeNeighbors],
  );

  const refresh = useCallback(() => {
    setSpace((prev) => {
      if (!prev.centerId) return prev;
      // Bump refresh expansion for variety
      const density = {
        ...prev.density,
        refreshExpansion: Math.min(1, prev.density.refreshExpansion + 0.1),
      };
      return {
        ...prev,
        density,
        neighbors: computeNeighbors(prev.centerId, density),
      };
    });
  }, [computeNeighbors]);

  const expand = useCallback(() => {
    setSpace((prev) => {
      if (!prev.centerId) return prev;
      const density = {
        ...prev.density,
        deepLayerDensity: Math.min(1, prev.density.deepLayerDensity + 0.2),
      };
      return {
        ...prev,
        density,
        neighbors: computeNeighbors(prev.centerId, density),
      };
    });
  }, [computeNeighbors]);

  const updateDensity = useCallback((params: Partial<DensityParams>) => {
    setSpace((prev) => ({
      ...prev,
      density: { ...prev.density, ...params },
    }));
  }, []);

  const goBack = useCallback(() => {
    setSpace((prev) => {
      if (prev.previousCenterIds.length === 0) return prev;
      const prevCenters = [...prev.previousCenterIds];
      const backId = prevCenters.pop()!;
      return {
        ...prev,
        centerId: backId,
        previousCenterIds: prevCenters,
        neighbors: computeNeighbors(backId, prev.density),
      };
    });
  }, [computeNeighbors]);

  return (
    <ConceptSpaceContext.Provider
      value={{
        space,
        setCenter,
        refresh,
        expand,
        updateDensity,
        goBack,
        pool,
      }}
    >
      {children}
    </ConceptSpaceContext.Provider>
  );
}

export function useConceptSpace() {
  const ctx = useContext(ConceptSpaceContext);
  if (!ctx) throw new Error('useConceptSpace must be used within ConceptSpaceProvider');
  return ctx;
}
