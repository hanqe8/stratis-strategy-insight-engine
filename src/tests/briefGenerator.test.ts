import { describe, expect, it } from "vitest";
import { generateDetailedBrief, generateMarkdownBrief } from "../lib/briefGenerator";
import { sampleStore } from "../data/sample-projects";

describe("brief generator", () => {
  it("generates executive and detailed brief structures", () => {
    const executive = generateMarkdownBrief(sampleStore, "proj-asean-wealth");
    const detailed = generateDetailedBrief(sampleStore, "proj-asean-wealth");

    expect(executive).toContain("## Decision and recommendation");
    expect(executive.indexOf("## Decision and recommendation")).toBeLessThan(executive.indexOf("## Evidence base"));
    expect(executive).toContain("## Option scoring");
    expect(executive.indexOf("## Option scoring")).toBeLessThan(executive.indexOf("## Watch-outs"));
    expect(executive.indexOf("## Watch-outs")).toBeLessThan(executive.indexOf("## Next actions"));
    expect(executive.indexOf("## Next actions")).toBeLessThan(executive.indexOf("## Key assumptions"));
    expect(executive).toContain("| S/No. | Evidence | Source | Confidence | Relevance | Tagged Category |");
    expect(executive).toContain("| S/No. | Details | Likelihood | Severity | Risk Score | How to Validate |");
    expect(executive).toContain("| S/No. | Assumptions |");
    expect(executive).not.toContain("## Decision log");
    expect(detailed).toContain("## 1. Decision Context");
    expect(detailed).toContain("## 3. Option Scoring");
    expect(detailed.indexOf("## 3. Option Scoring")).toBeLessThan(detailed.indexOf("## 4. Watch-Outs"));
    expect(detailed.indexOf("## 4. Watch-Outs")).toBeLessThan(detailed.indexOf("## 5. Next Actions"));
    expect(detailed).toContain("## 13. Audit Gaps");
    expect(detailed).not.toContain("Decision Change History");
  });
});
