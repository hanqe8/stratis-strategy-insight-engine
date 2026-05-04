import type { Criterion, DecisionOption, OptionScore } from "../types/decision";

export interface OptionTotal {
  optionId: string;
  optionName: string;
  total: number;
  rank: number;
  missingScores: number;
}

export function getWeightTotal(criteria: Criterion[]): number {
  return criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
}

export function weightsAreValid(criteria: Criterion[]): boolean {
  return Math.abs(getWeightTotal(criteria) - 100) < 0.001;
}

export function calculateOptionTotals(
  options: DecisionOption[],
  criteria: Criterion[],
  scores: OptionScore[]
): OptionTotal[] {
  const scoreMap = new Map(
    scores.map((score) => [`${score.optionId}:${score.criterionId}`, score])
  );

  const totals = options.map((option) => {
    let missingScores = 0;
    const total = criteria.reduce((sum, criterion) => {
      const optionScore = scoreMap.get(`${option.id}:${criterion.id}`);
      if (!optionScore) {
        missingScores += 1;
        return sum;
      }
      return sum + optionScore.score * (criterion.weight / 100);
    }, 0);

    return {
      optionId: option.id,
      optionName: option.name,
      total: Number(total.toFixed(2)),
      rank: 0,
      missingScores
    };
  });

  return totals
    .sort((a, b) => b.total - a.total)
    .map((total, index) => ({ ...total, rank: index + 1 }));
}

export function getRecommendedOption(totals: OptionTotal[]): OptionTotal | undefined {
  return [...totals].sort((a, b) => a.rank - b.rank)[0];
}
