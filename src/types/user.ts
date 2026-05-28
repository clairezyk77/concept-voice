import type { RelationType, SeedPool } from './concept.ts';

export interface Activation {
  conceptId: string;
  activatedAt: number;
  strength: number;
  visitCount: number;
}

export interface Connection {
  sourceId: string;
  targetId: string;
  type: RelationType;
  createdAt: number;
}

export interface PathStep {
  conceptId: string;
  timestamp: number;
}

export interface ExplorationPath {
  id: string;
  steps: PathStep[];
  title?: string;
  merged: boolean;
}

export interface SynthesizedStructure {
  id: string;
  conceptIds: string[];
  label: string;
  detectedAt: number;
  merged: boolean;
}

export interface UserKnowledge {
  activations: Record<string, Activation>;
  connections: Connection[];
  paths: ExplorationPath[];
  structures: SynthesizedStructure[];
  questions: string[];
  bannedConceptIds: string[];
  pinnedConceptIds: string[];
  importedDomains: Record<string, SeedPool>;
}
