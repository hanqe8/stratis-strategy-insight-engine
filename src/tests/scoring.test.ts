import { describe, expect, it } from "vitest";
import { calculateOptionTotals, getWeightTotal, weightsAreValid } from "../lib/scoring";
import type { Criterion, DecisionOption, OptionScore } from "../types/decision";

const options: DecisionOption[] = [
  { id: "a", projectId: "p", name: "A", description: "" },
  { id: "b", projectId: "p", name: "B", description: "" }
];

const criteria: Criterion[] = [
  { id: "market", projectId: "p", name: "Market", weight: 60 },
  { id: "risk", projectId: "p", name: "Risk", weight: 40 }
];

const scores: OptionScore[] = [
  { id: "1", optionId: "a", criterionId: "market", score: 5, rationale: "" },
  { id: "2", optionId: "a", criterionId: "risk", score: 2, rationale: "" },
  { id: "3", optionId: "b", criterionId: "market", score: 3, rationale: "" },
  { id: "4", optionId: "b", criterionId: "risk", score: 5, rationale: "" }
];

describe("scoring", () => {
  it("validates weight totals", () => {
    expect(getWeightTotal(criteria)).toBe(100);
    expect(weightsAreValid(criteria)).toBe(true);
    expect(weightsAreValid([{ ...criteria[0], weight: 50 }, criteria[1]])).toBe(false);
  });

  it("calculates weighted option totals and ranks", () => {
    const totals = calculateOptionTotals(options, criteria, scores);
    expect(totals[0]).toMatchObject({ optionId: "a", total: 3.8, rank: 1 });
    expect(totals[1]).toMatchObject({ optionId: "b", total: 3.8, rank: 2 });
  });

  it("tracks missing scores", () => {
    const totals = calculateOptionTotals(options, criteria, scores.slice(0, 3));
    expect(totals.find((item) => item.optionId === "b")?.missingScores).toBe(1);
  });
});
