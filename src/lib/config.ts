import type { OpenRouterModelPreset } from "../types/ai";
import type { StrategyStore } from "../types/store";

export const defaultProjectTypes = [
  "Market Entry",
  "Product Strategy",
  "Financial Analysis",
  "Macro Briefing",
  "Platform Strategy",
  "Transformation"
];

export const defaultProjectStatuses = ["Draft", "In Review", "Recommended", "Archived"];

export const defaultSourceTypes = [
  "Official",
  "Filing",
  "Regulator",
  "Company",
  "News",
  "Analyst",
  "InternalNote",
  "UserProvided"
];

export const defaultOpenRouterPresets: OpenRouterModelPreset[] = [
  {
    id: "anthropic/claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    provider: "Anthropic",
    strength: "Strong general strategy synthesis and long-form reasoning",
    priceTier: "High",
    sourceNote: "Ranking-informed preset; verify current price and availability in OpenRouter."
  },
  {
    id: "anthropic/claude-opus-4.7",
    label: "Claude Opus 4.7",
    provider: "Anthropic",
    strength: "Premium complex reasoning and executive narrative drafting",
    priceTier: "High",
    sourceNote: "Ranking-informed preset; verify current price and availability in OpenRouter."
  },
  {
    id: "deepseek/deepseek-v3.2",
    label: "DeepSeek V3.2",
    provider: "DeepSeek",
    strength: "Cost-conscious structured extraction and analysis",
    priceTier: "Medium",
    sourceNote: "Ranking-informed preset; verify current price and availability in OpenRouter."
  },
  {
    id: "google/gemini-3-flash-preview",
    label: "Gemini 3 Flash Preview",
    provider: "Google",
    strength: "Fast document extraction and summary drafting",
    priceTier: "Low",
    sourceNote: "Ranking-informed preset; verify current price and availability in OpenRouter."
  },
  {
    id: "moonshotai/kimi-k2.6",
    label: "Kimi K2.6",
    provider: "Moonshot AI",
    strength: "Long-context analysis and value-oriented extraction",
    priceTier: "Medium",
    sourceNote: "Ranking-informed preset; verify current price and availability in OpenRouter."
  }
];

export function normalizeOption(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isDuplicateOption(value: string, options: string[], currentIndex?: number): boolean {
  const normalized = normalizeOption(value).replace(/\s+/g, "").toLowerCase();
  return options.some((option, index) => index !== currentIndex && normalizeOption(option).replace(/\s+/g, "").toLowerCase() === normalized);
}

export function sortOptionsAlphabetically<T extends string>(options: T[], formatter: (value: T) => string = (value) => value): T[] {
  return [...options].sort((a, b) => formatter(a).localeCompare(formatter(b), undefined, { sensitivity: "base" }));
}

export function ensureStoreConfig(store: Partial<StrategyStore>): StrategyStore {
  return {
    config: {
      projectTypes: sortOptionsAlphabetically(store.config?.projectTypes?.length ? store.config.projectTypes : defaultProjectTypes),
      projectStatuses: sortOptionsAlphabetically(store.config?.projectStatuses?.length ? store.config.projectStatuses : defaultProjectStatuses),
      sourceTypes: sortOptionsAlphabetically(store.config?.sourceTypes?.length ? store.config.sourceTypes : defaultSourceTypes, formatSourceType),
      openRouterPresets: store.config?.openRouterPresets?.length ? store.config.openRouterPresets : defaultOpenRouterPresets,
      aiSettings: {
        selectedModel: store.config?.aiSettings?.selectedModel ?? defaultOpenRouterPresets[0].id,
        customModelId: store.config?.aiSettings?.customModelId ?? "",
        siteUrl: store.config?.aiSettings?.siteUrl ?? window.location.origin,
        appTitle: store.config?.aiSettings?.appTitle ?? "Stratis - Strategy & Insight Engine"
      },
      modelMetadata: store.config?.modelMetadata ?? [],
      modelMetadataRetrievedAt: store.config?.modelMetadataRetrievedAt,
      themeMode: store.config?.themeMode ?? "light"
    },
    projects: store.projects ?? [],
    evidence: store.evidence ?? [],
    assumptions: store.assumptions ?? [],
    options: store.options ?? [],
    criteria: store.criteria ?? [],
    scores: store.scores ?? [],
    premortems: store.premortems ?? [],
    decisionLog: store.decisionLog ?? [],
    chartInsights: store.chartInsights ?? [],
    extractedDocuments: store.extractedDocuments ?? [],
    documentChunks: store.documentChunks ?? [],
    aiCandidates: store.aiCandidates ?? []
  };
}

export function formatSourceType(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

export function canonicalizeSourceType(value: string): string {
  const normalized = normalizeOption(value);
  if (!normalized) return "";
  return normalized
    .split(/\s+/)
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toUpperCase() + part.slice(1)
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
}
