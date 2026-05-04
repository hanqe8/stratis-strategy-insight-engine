import type { DataProvenance } from "./provenance";

export interface DecisionOption {
  id: string;
  projectId: string;
  name: string;
  description: string;
  provenance?: DataProvenance;
}

export interface Criterion {
  id: string;
  projectId: string;
  name: string;
  weight: number;
  provenance?: DataProvenance;
}

export interface OptionScore {
  id: string;
  optionId: string;
  criterionId: string;
  score: number;
  rationale: string;
  provenance?: DataProvenance;
}

export interface PremortemItem {
  id: string;
  projectId: string;
  failureCause: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  severity: 1 | 2 | 3 | 4 | 5;
  mitigation: string;
  earlyWarning: string;
  owner?: string;
  provenance?: DataProvenance;
}

export interface ChartInsight {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  xField: string;
  yField: string;
  chartType: "line" | "bar";
  createdAt: string;
}
