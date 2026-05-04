import { describe, expect, it } from "vitest";
import { rebalanceCriteria, rebalanceCriteriaWithAdjustments, runSensitivity } from "../lib/sensitivity";
import type { Criterion, DecisionOption, OptionScore } from "../types/decision";

const options: DecisionOption[] = [
  { id: "fast", projectId: "p", name: "Fast", description: "" },
  { id: "control", projectId: "p", name: "Control", description: "" }
];

const criteria: Criterion[] = [
  { id: "speed", projectId: "p", name: "Speed", weight: 50 },
  { id: "ownership", projectId: "p", name: "Ownership", weight: 50 }
];

const scores: OptionScore[] = [
  { id: "1", optionId: "fast", criterionId: "speed", score: 5, rationale: "" },
  { id: "2", optionId: "fast", criterionId: "ownership", score: 1, rationale: "" },
  { id: "3", optionId: "control", criterionId: "speed", score: 1, rationale: "" },
  { id: "4", optionId: "control", criterionId: "ownership", score: 5, rationale: "" }
];

describe("sensitivity", () => {
  it("rebalances remaining criteria to keep total at 100", () => {
    const adjusted = rebalanceCriteria(criteria, "speed", 80);
    expect(adjusted.find((item) => item.id === "speed")?.weight).toBe(80);
    expect(adjusted.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });

  it("detects recommendation changes", () => {
    const result = runSensitivity(options, criteria, scores, "speed", 20);
    expect(result.recommendationChanged).toBe(true);
    expect(result.afterTop).toBe("Control");
  });

  it("rebalances multiple adjusted criteria and preserves total weight", () => {
    const adjusted = rebalanceCriteriaWithAdjustments(criteria, [
      { criterionId: "speed", weight: 30 },
      { criterionId: "ownership", weight: 70 }
    ]);
    expect(adjusted.find((item) => item.id === "speed")?.weight).toBe(30);
    expect(adjusted.find((item) => item.id === "ownership")?.weight).toBe(70);
    expect(adjusted.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });
});
