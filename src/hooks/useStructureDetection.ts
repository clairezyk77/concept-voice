import { useMemo, useCallback } from 'react';
import { useConceptSpace } from '../store/ConceptSpaceContext.tsx';
import { useUserKnowledge } from '../store/UserKnowledgeContext.tsx';
import { detectStructures, hintToStructure } from '../engine/structureDetection.ts';

export function useStructureDetection() {
  const { pool } = useConceptSpace();
  const { knowledge, updateKnowledge } = useUserKnowledge();

  const hints = useMemo(
    () => detectStructures(knowledge, pool),
    [knowledge, pool],
  );

  const generateStructure = useCallback(
    (hintIndex: number) => {
      const hint = hints[hintIndex];
      if (!hint) return;
      const structure = hintToStructure(hint, pool);
      updateKnowledge((prev) => ({
        ...prev,
        structures: [...prev.structures, structure],
      }));
    },
    [hints, pool, updateKnowledge],
  );

  return { hints, structures: knowledge.structures, generateStructure };
}
