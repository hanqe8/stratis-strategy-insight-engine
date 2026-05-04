import type { Criterion, DecisionOption, OptionScore } from "../types/decision";
import { calculateOptionTotals, getRecommendedOption } from "./scoring";

export interface SensitivityResult {
  adjustedCriteria: Criterion[];
  beforeTop?: string;
  afterTop?: string;
  recommendationChanged: boolean;
  driverSummary: string;
}

export interface CriterionAdjustment {
  criterionId: string;
  weight: number;
}

export function rebalanceCriteria(
  criteria: Criterion[],
  criterionId: string,
  newWeight: number
): Criterion[] {
  const clampedWeight = Math.min(100, Math.max(0, newWeight));
  const selected = criteria.find((criterion) => criterion.id === criterionId);
  if (!selected) return criteria;

  const others = criteria.filter((criterion) => criterion.id !== criterionId);
  const othersTotal = others.reduce((sum, criterion) => sum + criterion.weight, 0);
  const remaining = 100 - clampedWeight;

  if (others.length === 0) {
    return [{ ...selected, weight: 100 }];
  }

  return criteria.map((criterion) => {
    if (criterion.id === criterionId) {
      return { ...criterion, weight: Number(clampedWeight.toFixed(2)) };
    }
    const nextWeight =
      othersTotal === 0 ? remaining / others.length : (criterion.weight / othersTotal) * remaining;
    return { ...criterion, weight: Number(nextWeight.toFixed(2)) };
  });
}

export function runSensitivity(
  options: DecisionOption[],
  criteria: Criterion[],
  scores: OptionScore[],
  criterionId: string,
  newWeight: number
): SensitivityResult {
  const beforeTop = getRecommendedOption(calculateOptionTotals(options, criteria, scores));
  const adjustedCriteria = rebalanceCriteria(criteria, criterionId, newWeight);
  const afterTop = getRecommendedOption(
    calculateOptionTotals(options, adjustedCriteria, scores)
  );
  const criterionName =
    criteria.find((criterion) => criterion.id === criterionId)?.name ?? "Selected criterion";
  const recommendationChanged = beforeTop?.optionId !== afterTop?.optionId;

  return {
    adjustedCriteria,
    beforeTop: beforeTop?.optionName,
    afterTop: afterTop?.optionName,
    recommendationChanged,
    driverSummary: recommendationChanged
      ? `${criterionName} can flip the recommendation from ${beforeTop?.optionName} to ${afterTop?.optionName}.`
      : `${criterionName} did not change the top-ranked option at this weight.`
  };
}

export function rebalanceCriteriaWithAdjustments(
  criteria: Criterion[],
  adjustments: CriterionAdjustment[]
): Criterion[] {
  const validAdjustments = adjustments
    .filter((adjustment) => criteria.some((criterion) => criterion.id === adjustment.criterionId))
    .map((adjustment) => ({
      criterionId: adjustment.criterionId,
      weight: Math.min(100, Math.max(0, adjustment.weight))
    }));
  const adjustedIds = new Set(validAdjustments.map((adjustment) => adjustment.criterionId));
  const adjustedTotal = validAdjustments.reduce((sum, adjustment) => sum + adjustment.weight, 0);
  const remainingWeight = Math.max(0, 100 - adjustedTotal);
  const untouched = criteria.filter((criterion) => !adjustedIds.has(criterion.id));
  const untouchedOriginalTotal = untouched.reduce((sum, criterion) => sum + criterion.weight, 0);

  return criteria.map((criterion) => {
    const adjustment = validAdjustments.find((item) => item.criterionId === criterion.id);
    if (adjustment) {
      return { ...criterion, weight: Number(adjustment.weight.toFixed(2)) };
    }
    if (!untouched.length) return { ...criterion, weight: 0 };
    const nextWeight =
      untouchedOriginalTotal === 0
        ? remainingWeight / untouched.length
        : (criterion.weight / untouchedOriginalTotal) * remainingWeight;
    return { ...criterion, weight: Number(nextWeight.toFixed(2)) };
  });
}

export function findSensitivityDrivers(
  options: DecisionOption[],
  criteria: Criterion[],
  scores: OptionScore[]
): string[] {
  return criteria
    .map((criterion) => {
      const low = runSensitivity(options, criteria, scores, criterion.id, Math.max(0, criterion.weight - 20));
      const high = runSensitivity(options, criteria, scores, criterion.id, Math.min(100, criterion.weight + 20));
      return low.recommendationChanged || high.recommendationChanged ? criterion.name : "";
    })
    .filter(Boolean)
    .slice(0, 2);
}
