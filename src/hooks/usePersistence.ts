import { useState, useCallback } from 'react';
import type { UserKnowledge } from '../types/user.ts';

const DEFAULT_USER_KNOWLEDGE: UserKnowledge = {
  activations: {},
  connections: [],
  paths: [],
  structures: [],
  questions: [],
  bannedConceptIds: [],
  pinnedConceptIds: [],
  importedDomains: {},
};

export function usePersistence() {
  const [userKnowledge, setUserKnowledge] = useState<UserKnowledge>(() => {
    try {
      const stored = localStorage.getItem('concept-voice-user-knowledge');
      if (stored) {
        return { ...DEFAULT_USER_KNOWLEDGE, ...JSON.parse(stored) } as UserKnowledge;
      }
    } catch {
      // ignore parse errors
    }
    return { ...DEFAULT_USER_KNOWLEDGE };
  });

  const persist = useCallback((knowledge: UserKnowledge) => {
    try {
      localStorage.setItem('concept-voice-user-knowledge', JSON.stringify(knowledge));
    } catch {
      // storage full or unavailable
    }
  }, []);

  const updateKnowledge = useCallback(
    (updater: (prev: UserKnowledge) => UserKnowledge) => {
      setUserKnowledge((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const resetKnowledge = useCallback(() => {
    const fresh = { ...DEFAULT_USER_KNOWLEDGE };
    setUserKnowledge(fresh);
    persist(fresh);
  }, [persist]);

  return { userKnowledge, updateKnowledge, resetKnowledge };
}
