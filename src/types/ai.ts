import type { Criterion, DecisionOption, OptionScore, PremortemItem } from "./decision";
import type { Assumption, EvidenceItem } from "./evidence";
import type { DecisionLogEntry } from "./project";

export interface OpenRouterModelPreset {
  id: string;
  label: string;
  provider: string;
  strength: string;
  priceTier: "Low" | "Medium" | "High" | "Unknown";
  sourceNote: string;
}

export interface AiSettings {
  selectedModel: string;
  customModelId: string;
  siteUrl: string;
  appTitle: string;
}

export interface ExtractedDocument {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  extractedAt: string;
  chunkCount: number;
  textRetained: boolean;
  limitationNote?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  projectId: string;
  fileName: string;
  chunkIndex: number;
  pageStart?: number;
  pageEnd?: number;
  sectionIndex?: number;
  text: string;
  estimatedTokens: number;
}

export type AiCandidateKind =
  | "Evidence"
  | "Assumption"
  | "Option"
  | "Criterion"
  | "Score"
  | "Premortem"
  | "BriefNote"
  | "DecisionLog";

export type AiCandidateStatus = "Pending" | "Accepted" | "Rejected";

export type AiCandidatePayload =
  | Partial<EvidenceItem>
  | Partial<Assumption>
  | Partial<DecisionOption>
  | Partial<Criterion>
  | Partial<OptionScore>
  | Partial<PremortemItem>
  | Partial<DecisionLogEntry>
  | { title?: string; body: string };

export interface AiCandidate {
  id: string;
  projectId: string;
  kind: AiCandidateKind;
  status: AiCandidateStatus;
  payload: AiCandidatePayload;
  originalPayload?: AiCandidatePayload;
  originalRationale?: string;
  originalWhyBetter?: string;
  sourceFileName?: string;
  sourceReference?: string;
  confidence: "Low" | "Medium" | "High";
  rationale: string;
  originalValue?: string;
  proposedValue?: string;
  whyBetter?: string;
  modifiedByUser?: boolean;
  createdAt: string;
}

export interface OpenRouterModelMetadata {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
}
