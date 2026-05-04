import type { ChartInsight, Criterion, DecisionOption, OptionScore, PremortemItem } from "./decision";
import type { Assumption, EvidenceItem } from "./evidence";
import type { DecisionLogEntry, Project } from "./project";
import type { AiCandidate, AiSettings, DocumentChunk, ExtractedDocument, OpenRouterModelMetadata, OpenRouterModelPreset } from "./ai";

export interface StrategyStore {
  config: {
    projectTypes: string[];
    projectStatuses: string[];
    sourceTypes: string[];
    openRouterPresets: OpenRouterModelPreset[];
    aiSettings: AiSettings;
    modelMetadata: OpenRouterModelMetadata[];
  };
  projects: Project[];
  evidence: EvidenceItem[];
  assumptions: Assumption[];
  options: DecisionOption[];
  criteria: Criterion[];
  scores: OptionScore[];
  premortems: PremortemItem[];
  decisionLog: DecisionLogEntry[];
  chartInsights: ChartInsight[];
  extractedDocuments: ExtractedDocument[];
  documentChunks: DocumentChunk[];
  aiCandidates: AiCandidate[];
}
