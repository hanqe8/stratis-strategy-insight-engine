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

export interface ExtractionResponse {
  candidates?: Omit<AiCandidate, "id" | "projectId" | "status" | "createdAt">[];
}

const extractionSchema = `
Return strict JSON only. Do not wrap in Markdown. Do not include comments or trailing commas. Return at most 20 total candidates:
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
For Assumption payload use: statement, impact, impactRationale, confidence, confidenceRationale, validationTest, invalidationTrigger, linkedEvidenceIds. The impact and confidence fields must be exactly one of Low, Medium, High. Put explanations only in impactRationale or confidenceRationale.
For Option payload use: name, description.
For Criterion payload use: name, weight.
For Score payload use: optionId if known, criterionId if known, score, rationale.
For Premortem payload use: failureCause, likelihood, severity, mitigation, earlyWarning, owner. Likelihood and severity must be integers from 1 to 5 only, where 1 is very low, 3 is moderate, and 5 is very high.
For DecisionLog payload use: decisionChange, reason, recommendationBefore, recommendationAfter.
For BriefNote payload use: title, body.
All claims must be grounded in supplied chunks. Do not invent facts.`;

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  return fenced ?? trimmed;
}

function stripTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, "$1");
}

function normalizeJsonText(text: string): string {
  return stripTrailingCommas(text.replace(/^\uFEFF/, "").trim());
}

function getJsonEnvelope(text: string): string | undefined {
  const candidate = stripJsonFences(text);
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1) return undefined;
  return normalizeJsonText(candidate.slice(start, end === -1 ? undefined : end + 1));
}

function parseCandidateObjects(text: string): ExtractionResponse {
  const source = stripJsonFences(text);
  const candidatesKey = source.search(/"candidates"\s*:/);
  if (candidatesKey === -1) return {};
  const arrayStart = source.indexOf("[", candidatesKey);
  if (arrayStart === -1) return {};

  const candidates: ExtractionResponse["candidates"] = [];
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escaped = false;

  for (let index = arrayStart + 1; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) objectStart = index;
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
        const objectText = normalizeJsonText(source.slice(objectStart, index + 1));
        try {
          candidates.push(JSON.parse(objectText) as NonNullable<ExtractionResponse["candidates"]>[number]);
        } catch {
          // Keep scanning; a later object may still be valid.
        }
        objectStart = -1;
      }
    }
  }

  return candidates.length ? { candidates } : {};
}

export function parseOpenRouterExtractionResponse(text: string): ExtractionResponse {
  const envelope = getJsonEnvelope(text);
  if (!envelope) return {};
  try {
    return JSON.parse(envelope) as ExtractionResponse;
  } catch (error) {
    const salvaged = parseCandidateObjects(text);
    if (salvaged.candidates?.length) return salvaged;
    const message = error instanceof Error ? error.message : "Unknown JSON parse error";
    throw new Error(`The model returned malformed or incomplete JSON (${message}). Try rerunning with fewer retained text chunks, a larger-context model, or web search disabled.`);
  }
}

function splitLevelAndRationale(value: unknown): { level: "Low" | "Medium" | "High"; rationale?: string } {
  const text = String(value ?? "").trim();
  const match = text.match(/\b(low|medium|high)\b/i);
  const level = match ? (match[1][0].toUpperCase() + match[1].slice(1).toLowerCase()) as "Low" | "Medium" | "High" : "Medium";
  const rationale = text
    .replace(new RegExp(`\\b${level}\\b`, "i"), "")
    .replace(/^[\s:;,.()-]+/, "")
    .trim();
  return { level, rationale: rationale || undefined };
}

function clampScaleValue(value: unknown): 1 | 2 | 3 | 4 | 5 {
  const rounded = Math.round(Number(value));
  if (!Number.isFinite(rounded)) return 3;
  return Math.min(5, Math.max(1, rounded)) as 1 | 2 | 3 | 4 | 5;
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
      max_tokens: 12000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter extraction failed with ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as { choices?: { finish_reason?: string; message?: { content?: string } }[] };
  const finishReason = data.choices?.[0]?.finish_reason;
  const content = data.choices?.[0]?.message?.content ?? "{}";
  if (finishReason === "length") {
    throw new Error("The model response was cut off before valid JSON could be completed. Rerun with fewer retained text chunks or choose a model with a larger output limit.");
  }
  const parsed = parseOpenRouterExtractionResponse(content);
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
    const impact = splitLevelAndRationale(payload.impact);
    const confidence = splitLevelAndRationale(payload.confidence);
    return {
      ...withCandidate,
      assumptions: [
        {
          id,
          projectId,
          statement: String(payload.statement ?? ""),
          impact: impact.level,
          confidence: confidence.level,
          impactRationale: String(payload.impactRationale ?? impact.rationale ?? ""),
          confidenceRationale: String(payload.confidenceRationale ?? confidence.rationale ?? ""),
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
          likelihood: clampScaleValue(payload.likelihood),
          severity: clampScaleValue(payload.severity),
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
