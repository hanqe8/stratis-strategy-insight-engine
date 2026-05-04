import type { DataProvenance } from "./provenance";

export type ProjectType = string;

export type ProjectStatus = string;

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  decisionQuestion: string;
  timeHorizon: string;
  owner: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionLogEntry {
  id: string;
  projectId: string;
  timestamp: string;
  decisionChange: string;
  reason: string;
  evidenceAdded?: string;
  assumptionChanged?: string;
  recommendationBefore?: string;
  recommendationAfter?: string;
  provenance?: DataProvenance;
}
