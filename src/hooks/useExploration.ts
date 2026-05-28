import { useCallback } from 'react';
import { useUserKnowledge } from '../store/UserKnowledgeContext.tsx';
import { useConceptSpace } from '../store/ConceptSpaceContext.tsx';

/**
 * Hook that connects exploration actions with user knowledge tracking.
 */
export function useExploration() {
  const { setCenter, space, refresh, expand, goBack } = useConceptSpace();
  const { activateConcept, addPath, connectConcepts, isActivated } = useUserKnowledge();

  const navigateTo = useCallback(
    (conceptId: string) => {
      setCenter(conceptId);
    },
    [setCenter],
  );

  const handleActivate = useCallback(
    (conceptId: string) => {
      activateConcept(conceptId);
      addPath(conceptId);
    },
    [activateConcept, addPath],
  );

  const handleConnect = useCallback(
    (sourceId: string, targetId: string, type: string) => {
      connectConcepts(sourceId, targetId, type);
    },
    [connectConcepts],
  );

  return {
    navigateTo,
    handleActivate,
    handleConnect,
    handleRefresh: refresh,
    handleExpand: expand,
    handleGoBack: goBack,
    currentCenterId: space.centerId,
    canGoBack: space.previousCenterIds.length > 0,
    isActivated,
  };
}
