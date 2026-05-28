export interface Concept {
  id: string;
  label: string;
  description: string;
  domain: string;
  type: 'core' | 'bridge' | 'domain';
}

export type RelationType =
  | 'hierarchy'
  | 'neighborhood'
  | 'bridge'
  | 'process'
  | 'composition'
  | 'contrast';

export interface Relation {
  sourceId: string;
  targetId: string;
  type: RelationType;
  strength: number;
}

export interface SeedPool {
  concepts: Concept[];
  relations: Relation[];
}
