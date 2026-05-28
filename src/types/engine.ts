export interface DensityParams {
  localDensity: number;
  refreshExpansion: number;
  crossDomainDrift: number;
  deepLayerDensity: number;
}

export interface RecommendationRequest {
  centerConceptId: string;
  activatedIds: Set<string>;
  bannedIds: Set<string>;
  density: DensityParams;
}

export interface RecommendationResult {
  neighbors: ScoredConcept[];
  explanations: string[];
}

export interface ScoredConcept {
  conceptId: string;
  score: number;
  relationType: string;
  relationStrength: number;
  centerIsSource: boolean;
}

export interface EntryResult {
  concepts: string[];
  suggestions: string[];
}

export interface StructureHint {
  sharedConceptId: string;
  involvedConceptIds: string[];
  domains: string[];
  score: number;
}
