import { describe, expect, it } from "vitest";
import { applyAiCandidate, parseOpenRouterExtractionResponse } from "../lib/openRouter";
import { sampleStore } from "../data/sample-projects";
import type { AiCandidate } from "../types/ai";

describe("OpenRouter extraction parsing", () => {
  it("accepts fenced JSON with trailing commas", () => {
    const parsed = parseOpenRouterExtractionResponse(`\`\`\`json
{
  "candidates": [
    {
      "kind": "Evidence",
      "payload": { "claim": "A", },
      "confidence": "Medium",
      "rationale": "Grounded in source",
    },
  ],
}
\`\`\``);

    expect(parsed.candidates).toHaveLength(1);
    expect(parsed.candidates?.[0].kind).toBe("Evidence");
  });

  it("salvages complete candidate objects from truncated output", () => {
    const parsed = parseOpenRouterExtractionResponse(`{
  "candidates": [
    {
      "kind": "Assumption",
      "payload": { "statement": "Partner can onboard users" },
      "confidence": "Medium",
      "rationale": "Supported by uploaded material"
    },
    {
      "kind": "Evidence",
      "payload": { "claim": "truncated" },
      "confidence": "Low",
`);

    expect(parsed.candidates).toHaveLength(1);
    expect(parsed.candidates?.[0].kind).toBe("Assumption");
  });

  it("keeps assumption impact and confidence categorical when accepting AI output", () => {
    const candidate: AiCandidate = {
      id: "cand-assumption",
      projectId: "proj-asean-wealth",
      kind: "Assumption",
      status: "Pending",
      payload: {
        statement: "Partner onboarding can complete within two quarters.",
        impact: "High because this determines launch feasibility",
        confidence: "Medium - based on partial evidence",
        validationTest: "Confirm partner plan",
        invalidationTrigger: "Compliance review delays"
      } as unknown as AiCandidate["payload"],
      confidence: "Medium",
      rationale: "Extracted from uploaded memo.",
      createdAt: "2026-05-05T00:00:00.000Z"
    };

    const next = applyAiCandidate(sampleStore, candidate);
    const accepted = next.assumptions[0];

    expect(accepted.impact).toBe("High");
    expect(accepted.confidence).toBe("Medium");
    expect(accepted.impactRationale).toContain("determines launch feasibility");
    expect(accepted.confidenceRationale).toContain("partial evidence");
  });
});
