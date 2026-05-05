import type { DataProvenance } from "./provenance";

export type Confidence = "Low" | "Medium" | "High";
export type Impact = "Low" | "Medium" | "High";

export type SourceType = string;

export interface EvidenceItem {
  id: string;
  projectId: string;
  sourceTitle: string;
  sourceUrl?: string;
  sourceType: SourceType;
  sourceDate?: string;
  claim: string;
  implication: string;
  confidence: Confidence;
  relevance: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  provenance?: DataProvenance;
}

export interface Assumption {
  id: string;
  projectId: string;
  statement: string;
  impact: Impact;
  confidence: Confidence;
  impactRationale?: string;
  confidenceRationale?: string;
  validationTest: string;
  invalidationTrigger: string;
  linkedEvidenceIds: string[];
  provenance?: DataProvenance;
}
