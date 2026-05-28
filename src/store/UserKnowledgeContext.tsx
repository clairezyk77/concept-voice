import { createContext, useContext, useCallback, useRef, type ReactNode } from 'react';
import type { UserKnowledge } from '../types/user.ts';
import type { SeedPool } from '../types/concept.ts';
import { usePersistence } from '../hooks/usePersistence.ts';

interface UserKnowledgeContextValue {
  knowledge: UserKnowledge;
  updateKnowledge: (updater: (prev: UserKnowledge) => UserKnowledge) => void;
  activateConcept: (conceptId: string) => void;
  connectConcepts: (sourceId: string, targetId: string, type: string) => void;
  addPath: (conceptId: string) => string | null;
  banConcept: (conceptId: string) => void;
  pinConcept: (conceptId: string) => void;
  unpinConcept: (conceptId: string) => void;
  addQuestion: (question: string) => void;
  resetKnowledge: () => void;
  isActivated: (conceptId: string) => boolean;
  isPinned: (conceptId: string) => boolean;
  isBanned: (conceptId: string) => boolean;
  importDomain: (domainName: string, data: SeedPool) => void;
}

const UserKnowledgeContext = createContext<UserKnowledgeContextValue | null>(null);

export function UserKnowledgeProvider({ children }: { children: ReactNode }) {
  const currentPathIdRef = useRef<string | null>(null);
  const { userKnowledge, updateKnowledge, resetKnowledge } = usePersistence();

  const activateConcept = useCallback(
    (conceptId: string) => {
      updateKnowledge((prev) => {
        const existing = prev.activations[conceptId];
        const now = Date.now();
        const activations = {
          ...prev.activations,
          [conceptId]: {
            conceptId,
            activatedAt: now,
            strength: existing ? Math.min(1, existing.strength + 0.15) : 0.5,
            visitCount: existing ? existing.visitCount + 1 : 1,
          },
        };
        return { ...prev, activations };
      });
    },
    [updateKnowledge],
  );

  const connectConcepts = useCallback(
    (sourceId: string, targetId: string, type: string) => {
      updateKnowledge((prev) => {
        const alreadyConnected = prev.connections.some(
          (c) =>
            (c.sourceId === sourceId && c.targetId === targetId) ||
            (c.sourceId === targetId && c.targetId === sourceId),
        );
        if (alreadyConnected) return prev;
        return {
          ...prev,
          connections: [
            ...prev.connections,
            {
              sourceId,
              targetId,
              type: type as any,
              createdAt: Date.now(),
            },
          ],
        };
      });
    },
    [updateKnowledge],
  );

  const addPath = useCallback(
    (conceptId: string): string | null => {
      let createdId: string | null = null;
      updateKnowledge((prev) => {
        const lastPath = prev.paths[prev.paths.length - 1];
        const now = Date.now();

        if (
          currentPathIdRef.current &&
          lastPath &&
          lastPath.id === currentPathIdRef.current &&
          !lastPath.merged
        ) {
          // Continue last path
          const updated = {
            ...lastPath,
            steps: [...lastPath.steps, { conceptId, timestamp: now }],
          };
          return {
            ...prev,
            paths: prev.paths.map((p) => (p.id === currentPathIdRef.current ? updated : p)),
          };
        }

        // Start new path
        const id = `path-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        currentPathIdRef.current = id;
        createdId = id;
        return {
          ...prev,
          paths: [
            ...prev.paths,
            {
              id,
              steps: [{ conceptId, timestamp: now }],
              merged: false,
            },
          ],
        };
      });
      return createdId;
    },
    [updateKnowledge],
  );

  const banConcept = useCallback(
    (conceptId: string) => {
      updateKnowledge((prev) => ({
        ...prev,
        bannedConceptIds: prev.bannedConceptIds.includes(conceptId)
          ? prev.bannedConceptIds
          : [...prev.bannedConceptIds, conceptId],
      }));
    },
    [updateKnowledge],
  );

  const pinConcept = useCallback(
    (conceptId: string) => {
      updateKnowledge((prev) => ({
        ...prev,
        pinnedConceptIds: prev.pinnedConceptIds.includes(conceptId)
          ? prev.pinnedConceptIds
          : [...prev.pinnedConceptIds, conceptId],
      }));
    },
    [updateKnowledge],
  );

  const unpinConcept = useCallback(
    (conceptId: string) => {
      updateKnowledge((prev) => ({
        ...prev,
        pinnedConceptIds: prev.pinnedConceptIds.filter((id) => id !== conceptId),
      }));
    },
    [updateKnowledge],
  );

  const addQuestion = useCallback(
    (question: string) => {
      updateKnowledge((prev) => ({
        ...prev,
        questions: [...prev.questions, question],
      }));
    },
    [updateKnowledge],
  );

  const importDomain = useCallback(
    (domainName: string, data: SeedPool) => {
      updateKnowledge((prev) => ({
        ...prev,
        importedDomains: {
          ...prev.importedDomains,
          [domainName]: data,
        },
      }));
    },
    [updateKnowledge],
  );

  const isActivated = useCallback(
    (conceptId: string) => conceptId in userKnowledge.activations,
    [userKnowledge.activations],
  );

  const isPinned = useCallback(
    (conceptId: string) => userKnowledge.pinnedConceptIds.includes(conceptId),
    [userKnowledge.pinnedConceptIds],
  );

  const isBanned = useCallback(
    (conceptId: string) => userKnowledge.bannedConceptIds.includes(conceptId),
    [userKnowledge.bannedConceptIds],
  );

  return (
    <UserKnowledgeContext.Provider
      value={{
        knowledge: userKnowledge,
        updateKnowledge,
        activateConcept,
        connectConcepts,
        addPath,
        banConcept,
        pinConcept,
        unpinConcept,
        addQuestion,
        resetKnowledge,
        isActivated,
        isPinned,
        isBanned,
        importDomain,
      }}
    >
      {children}
    </UserKnowledgeContext.Provider>
  );
}

export function useUserKnowledge() {
  const ctx = useContext(UserKnowledgeContext);
  if (!ctx) throw new Error('useUserKnowledge must be used within UserKnowledgeProvider');
  return ctx;
}
