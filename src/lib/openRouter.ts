import type { AiCandidate, OpenRouterModelMetadata } from "../types/ai";
import type { StrategyStore } from "../types/store";
import { canonicalizeSourceType } from "./config";

export interface OpenRouterExtractionRequest {
  apiKey: string;
  model: string;
  siteUrl: string;
  appTitle: string;
  projectId: string;
  projectTitle: string;
  decisionQuestion: string;
  enableWebSearch: boolean;
  chunks: {
    fileName: string;
    sourceReference: string;
    text: string;
  }[];
}

interface ExtractionResponse {
  candidates?: Omit<AiCandidate, "id" | "projectId" | "status" | "createdAt">[];
}

const extractionSchema = `
Return strict JSON only:
{
  "candidates": [
    {
      "kind": "Evidence" | "Assumption" | "Option" | "Criterion" | "Score" | "Premortem" | "BriefNote" | "DecisionLog",
      "payload": object,
      "sourceFileName": string,
      "sourceReference": string,
      "confidence": "Low" | "Medium" | "High",
      "rationale": string,
      "originalValue": string optional,
      "proposedValue": string optional,
      "whyBetter": string optional
    }
  ]
}

For Evidence payload use: sourceTitle, sourceUrl, sourceType, sourceDate, claim, implication, confidence, relevance, notes.
Set Evidence relevance as an integer 1-5 based on decision usefulness for the project decision question, where 5 directly affects the recommendation and 1 is peripheral context. Explain the relevance judgment in notes.
Use sourceType from these canonical categories when possible: Official, Filing, Regulator, Company, News, Analyst, InternalNote, UserProvided. If none fits, include suggestedSourceType and explain why.
Use ISO sourceDate as YYYY-MM-DD when available. If only year or month is available, return the best identified date and explain date uncertainty in notes.
For Assumption payload use: statement, impact, confidence, validationTest, invalidationTrigger, linkedEvidenceIds.
For Option payload use: name, description.
For Criterion payload use: name, weight.
For Score payload use: optionId if known, criterionId if known, score, rationale.
For Premortem payload use: failureCause, likelihood, severity, mitigation, earlyWarning, owner.
For DecisionLog payload use: decisionChange, reason, recommendationBefore, recommendationAfter.
For BriefNote payload use: title, body.
All claims must be grounded in supplied chunks. Do not invent facts.`;

function extractJson(text: string): ExtractionResponse {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  return JSON.parse(candidate.slice(start, end + 1)) as ExtractionResponse;
}

export async function fetchOpenRouterModels(apiKey?: string): Promise<OpenRouterModelMetadata[]> {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined
  });
  if (!response.ok) {
    throw new Error(`OpenRouter models request failed with ${response.status}`);
  }
  const data = (await response.json()) as { data?: OpenRouterModelMetadata[] };
  return data.data ?? [];
}

export async function extractCandidatesWithOpenRouter(request: OpenRouterExtractionRequest): Promise<AiCandidate[]> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${request.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": request.siteUrl,
      "X-Title": request.appTitle
    },
    body: JSON.stringify({
      model: request.model,
      messages: [
        {
          role: "system",
          content:
            "You are an evidence extraction analyst for an executive strategy workbench. Return auditable structured JSON only."
        },
        {
          role: "user",
          content: `Project: ${request.projectTitle}
Decision question: ${request.decisionQuestion}

${extractionSchema}

${request.enableWebSearch ? "Web search is enabled. Search only when it can materially cross-check or supplement the uploaded evidence. Online findings must be returned as Evidence candidates with sourceUrl, sourceTitle, sourceDate when available, confidence, and a clear rationale. Keep online-source insights separate from uploaded-document insights so the user can review them before acceptance." : "Web search is disabled. Use only the supplied document chunks."}

Document chunks:
${request.chunks
  .map((chunk, index) => `Chunk ${index + 1}: ${chunk.fileName} ${chunk.sourceReference}\n${chunk.text}`)
  .join("\n\n---\n\n")}`
        }
      ],
      tools: request.enableWebSearch
        ? [
            {
              type: "openrouter:web_search",
              parameters: {
                engine: "auto",
                max_results: 5,
                max_total_results: 10,
                search_context_size: "medium"
              }
            }
          ]
        : undefined,
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter extraction failed with ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = extractJson(content);
  return (parsed.candidates ?? []).map((candidate) => ({
    ...candidate,
    id: `cand-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    projectId: request.projectId,
    status: "Pending",
    originalPayload: candidate.payload,
    originalRationale: candidate.rationale,
    originalWhyBetter: candidate.whyBetter,
    createdAt: new Date().toISOString()
  }));
}

function normalizeEvidenceDate(value: unknown): { date?: string; note?: string } {
  if (typeof value !== "string" || !value.trim()) return {};
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { date: trimmed };
  if (/^\d{4}-\d{2}$/.test(trimmed)) return { date: `${trimmed}-01`, note: `Exact day was unclear; used ${trimmed}-01 as the best identified date.` };
  if (/^\d{4}$/.test(trimmed)) return { date: `${trimmed}-01-01`, note: `Exact month/day was unclear; used ${trimmed}-01-01 as the best identified date.` };
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return { date: parsed.toISOString().slice(0, 10), note: `Date was interpreted from "${trimmed}".` };
  }
  return { note: `The source date "${trimmed}" could not be converted to an exact date.` };
}

export function applyAiCandidate(store: StrategyStore, candidate: AiCandidate): StrategyStore {
  const projectId = candidate.projectId;
  const payload = candidate.payload as Record<string, unknown>;
  const id = `${candidate.kind.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const acceptedCandidate = { ...candidate, status: "Accepted" as const };
  const provenance = candidate.modifiedByUser ? "AIEdited" as const : "AI" as const;

  const withCandidate = {
    ...store,
    aiCandidates: store.aiCandidates.map((item) => (item.id === candidate.id ? acceptedCandidate : item))
  };

  if (candidate.kind === "Evidence") {
    const dateResult = normalizeEvidenceDate(payload.sourceDate);
    const sourceType = canonicalizeSourceType(String(payload.sourceType ?? payload.suggestedSourceType ?? "UserProvided")) || "UserProvided";
    const notes = [payload.notes, candidate.rationale, candidate.sourceReference ? `Source: ${candidate.sourceReference}` : "", dateResult.note]
      .filter(Boolean)
      .join(" ");
    return {
      ...withCandidate,
      evidence: [
        {
          id,
          projectId,
          sourceTitle: String(payload.sourceTitle ?? candidate.sourceFileName ?? "AI extracted evidence"),
          sourceUrl: typeof payload.sourceUrl === "string" ? payload.sourceUrl : undefined,
          sourceType,
          sourceDate: dateResult.date,
          claim: String(payload.claim ?? ""),
          implication: String(payload.implication ?? ""),
          confidence: payload.confidence === "High" || payload.confidence === "Low" ? payload.confidence : "Medium",
          relevance: [1, 2, 3, 4, 5].includes(Number(payload.relevance)) ? (Number(payload.relevance) as 1 | 2 | 3 | 4 | 5) : 3,
          notes,
          provenance
        },
        ...store.evidence
      ]
    };
  }

  if (candidate.kind === "Assumption") {
    return {
      ...withCandidate,
      assumptions: [
        {
          id,
          projectId,
          statement: String(payload.statement ?? ""),
          impact: payload.impact === "Low" || payload.impact === "Medium" ? payload.impact : "High",
          confidence: payload.confidence === "High" || payload.confidence === "Low" ? payload.confidence : "Medium",
          validationTest: String(payload.validationTest ?? ""),
          invalidationTrigger: String(payload.invalidationTrigger ?? ""),
          linkedEvidenceIds: [],
          provenance
        },
        ...store.assumptions
      ]
    };
  }

  if (candidate.kind === "Option") {
    return {
      ...withCandidate,
      options: [
        {
          id,
          projectId,
          name: String(payload.name ?? "AI proposed option"),
          description: String(payload.description ?? candidate.rationale),
          provenance
        },
        ...store.options
      ]
    };
  }

  if (candidate.kind === "Criterion") {
    return {
      ...withCandidate,
      criteria: [
        {
          id,
          projectId,
          name: String(payload.name ?? "AI proposed criterion"),
          weight: Number(payload.weight ?? 0),
          provenance
        },
        ...store.criteria
      ]
    };
  }

  if (candidate.kind === "Score") {
    const optionId = String(payload.optionId ?? "");
    const criterionId = String(payload.criterionId ?? "");
    if (!optionId || !criterionId) return withCandidate;
    const existing = store.scores.find((item) => item.optionId === optionId && item.criterionId === criterionId);
    const scorePayload = {
      id: existing?.id ?? id,
      optionId,
      criterionId,
      score: Number(payload.score ?? 0),
      rationale: `${String(payload.rationale ?? candidate.rationale)}${candidate.whyBetter ? ` Why better: ${candidate.whyBetter}` : ""}`,
      provenance
    };
    return {
      ...withCandidate,
      scores: existing
        ? store.scores.map((item) => (item.id === existing.id ? scorePayload : item))
        : [scorePayload, ...store.scores]
    };
  }

  if (candidate.kind === "Premortem") {
    return {
      ...withCandidate,
      premortems: [
        {
          id,
          projectId,
          failureCause: String(payload.failureCause ?? ""),
          likelihood: [1, 2, 3, 4, 5].includes(Number(payload.likelihood)) ? (Number(payload.likelihood) as 1 | 2 | 3 | 4 | 5) : 3,
          severity: [1, 2, 3, 4, 5].includes(Number(payload.severity)) ? (Number(payload.severity) as 1 | 2 | 3 | 4 | 5) : 3,
          mitigation: String(payload.mitigation ?? ""),
          earlyWarning: String(payload.earlyWarning ?? ""),
          owner: typeof payload.owner === "string" ? payload.owner : undefined,
          provenance
        },
        ...store.premortems
      ]
    };
  }

  if (candidate.kind === "DecisionLog") {
    return {
      ...withCandidate,
      decisionLog: [
        {
          id,
          projectId,
          timestamp: new Date().toISOString(),
          decisionChange: String(payload.decisionChange ?? "AI-assisted update accepted"),
          reason: String(payload.reason ?? candidate.rationale),
          recommendationBefore: typeof payload.recommendationBefore === "string" ? payload.recommendationBefore : undefined,
          recommendationAfter: typeof payload.recommendationAfter === "string" ? payload.recommendationAfter : undefined,
          provenance
        },
        ...store.decisionLog
      ]
    };
  }

  return withCandidate;
}
