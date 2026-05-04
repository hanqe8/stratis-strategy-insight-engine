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
    expect(detailed).toContain("## 1. Decision Context");
    expect(detailed).toContain("## 11. Audit Gaps");
  });
});
