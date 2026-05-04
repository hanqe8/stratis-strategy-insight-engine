import type { StrategyStore } from "../types/store";
import { formatSourceType } from "./config";
import { calculateOptionTotals, getRecommendedOption } from "./scoring";
import { findSensitivityDrivers } from "./sensitivity";

export function generateMarkdownBrief(store: StrategyStore, projectId: string): string {
  const project = store.projects.find((item) => item.id === projectId);
  if (!project) return "# Brief unavailable\n\nProject not found.";
  if (!project.decisionQuestion.trim()) {
    return "# Brief blocked\n\nA decision question is required before generating a recommendation.";
  }

  const evidence = store.evidence.filter((item) => item.projectId === projectId);
  const assumptions = store.assumptions.filter((item) => item.projectId === projectId);
  const options = store.options.filter((item) => item.projectId === projectId);
  const criteria = store.criteria.filter((item) => item.projectId === projectId);
  const scores = store.scores.filter((score) =>
    options.some((option) => option.id === score.optionId)
  );
  const totals = calculateOptionTotals(options, criteria, scores);
  const recommendation = getRecommendedOption(totals);
  const premortems = store.premortems
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => b.likelihood * b.severity - a.likelihood * a.severity)
    .slice(0, 5);
  const highImpactAssumptions = assumptions.filter((item) => item.impact === "High");
  const weakAssumptions = assumptions.filter(
    (item) => item.impact === "High" && item.confidence === "Low"
  );
  const sensitivityDrivers = findSensitivityDrivers(options, criteria, scores);
  const latestLog = store.decisionLog
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

  return `# ${project.title}

## Decision and recommendation
Decision question: ${project.decisionQuestion}

Bottom line: ${recommendation ? `Recommend ${recommendation.optionName}.` : "No recommendation yet. Add options, criteria, and scores."}

Current status: ${project.status}

## Recommendation logic
${recommendation ? `${recommendation.optionName} ranks first in the current weighted model with a ${recommendation.total.toFixed(2)}/5 score.` : "The recommendation is blocked because the scoring model is incomplete."}

## Option scoring
${totals.map((item) => `- #${item.rank} ${item.optionName}: ${item.total.toFixed(2)}/5 weighted score`).join("\n") || "- No scoring model available."}

## Key assumptions
${highImpactAssumptions.map((item) => `- ${item.statement} Confidence: ${item.confidence}. Validation: ${item.validationTest}`).join("\n") || "- No high-impact assumptions recorded."}

## Sensitivity
${sensitivityDrivers.length ? `Top sensitivity drivers: ${sensitivityDrivers.join(", ")}.` : "No recommendation-flipping driver identified in the +/-20 point criterion test."}

## Pre-mortem
${premortems.map((item) => `- ${item.failureCause} Risk score: ${item.likelihood * item.severity}. Mitigation: ${item.mitigation}. Early warning: ${item.earlyWarning}.`).join("\n") || "- No pre-mortem items added yet."}

## Watch-outs
${weakAssumptions.map((item) => `- High-impact low-confidence assumption: ${item.statement}`).join("\n") || "- No high-impact low-confidence assumptions flagged."}

## Next actions
- Validate the top assumptions before final executive review.
- Review scoring rationales for the highest-weight criteria.
- Refresh evidence dates before publishing the recommendation.

## Decision log
${latestLog ? `Latest change: ${latestLog.decisionChange}. Reason: ${latestLog.reason}.` : "No decision log events recorded."}

## Evidence base
${evidence.map((item, index) => `${index + 1}. ${item.claim} [${item.sourceTitle}${item.sourceUrl ? `](${item.sourceUrl})` : "]"}; confidence: ${item.confidence}; relevance: ${item.relevance}/5.`).join("\n") || "- No evidence added yet."}
`;
}

export function generateDetailedBrief(store: StrategyStore, projectId: string): string {
  const project = store.projects.find((item) => item.id === projectId);
  if (!project) return "# Detailed analysis unavailable\n\nProject not found.";

  const evidence = store.evidence.filter((item) => item.projectId === projectId);
  const assumptions = store.assumptions.filter((item) => item.projectId === projectId);
  const options = store.options.filter((item) => item.projectId === projectId);
  const criteria = store.criteria.filter((item) => item.projectId === projectId);
  const scores = store.scores.filter((score) =>
    options.some((option) => option.id === score.optionId)
  );
  const totals = calculateOptionTotals(options, criteria, scores);
  const recommendation = getRecommendedOption(totals);
  const premortems = store.premortems
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => b.likelihood * b.severity - a.likelihood * a.severity);
  const chartInsights = store.chartInsights.filter((item) => item.projectId === projectId);
  const acceptedAiNotes = store.aiCandidates.filter(
    (item) => item.projectId === projectId && item.status === "Accepted" && item.kind === "BriefNote"
  );
  const latestLogs = store.decisionLog
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5);

  return `# ${project.title} - Detailed Decision Rationale

## 1. Decision Context
- Decision question: ${project.decisionQuestion || "Not defined."}
- Project type: ${project.type}
- Time horizon: ${project.timeHorizon || "Not defined."}
- Owner: ${project.owner || "Not defined."}
- Status: ${project.status}

## 2. Recommendation Logic
${recommendation ? `The current model recommends ${recommendation.optionName} with a weighted score of ${recommendation.total.toFixed(2)}/5.` : "No recommendation is available because the model is incomplete."}

Ranking:
${totals.map((item) => `- #${item.rank}: ${item.optionName} at ${item.total.toFixed(2)}/5; missing scores: ${item.missingScores}`).join("\n") || "- No options scored."}

## 3. Evidence Trail
${evidence.map((item, index) => `${index + 1}. Claim: ${item.claim}
   Source: ${item.sourceTitle}${item.sourceUrl ? ` (${item.sourceUrl})` : ""}
   Type/date: ${formatSourceType(item.sourceType)}${item.sourceDate ? `, ${item.sourceDate}` : ""}
   Confidence/relevance: ${item.confidence}, ${item.relevance}/5
   Decision implication: ${item.implication}
   Notes: ${item.notes || "None"}`).join("\n\n") || "- No evidence entered."}

## 4. Assumption and Uncertainty Ledger
${assumptions.map((item) => `- ${item.statement}
  Impact/confidence: ${item.impact}/${item.confidence}
  Validation test: ${item.validationTest || "Not defined."}
  Invalidation trigger: ${item.invalidationTrigger || "Not defined."}
  Linked evidence IDs: ${item.linkedEvidenceIds.join(", ") || "None"}`).join("\n") || "- No assumptions entered."}

## 5. Scoring Method
Criteria:
${criteria.map((item) => `- ${item.name}: ${item.weight}%`).join("\n") || "- No criteria entered."}

Score rationales:
${scores.map((score) => {
  const option = options.find((item) => item.id === score.optionId);
  const criterion = criteria.find((item) => item.id === score.criterionId);
  return `- ${option?.name ?? score.optionId} / ${criterion?.name ?? score.criterionId}: ${score.score}/5. ${score.rationale || "No rationale entered."}`;
}).join("\n") || "- No scores entered."}

## 6. Sensitivity and What Could Change the Answer
${findSensitivityDrivers(options, criteria, scores).length
    ? `Potential recommendation-changing drivers: ${findSensitivityDrivers(options, criteria, scores).join(", ")}.`
    : "No recommendation-changing driver found in the default +/-20 point test."}

## 7. Risk Pre-mortem
${premortems.map((item) => `- ${item.failureCause}
  Risk score: ${item.likelihood * item.severity}
  Mitigation: ${item.mitigation}
  Early warning: ${item.earlyWarning}
  Owner: ${item.owner || "Unassigned"}`).join("\n") || "- No pre-mortem items entered."}

## 8. Financial and Market Signals
${chartInsights.map((item) => `- ${item.title}: ${item.summary}`).join("\n") || "- No chart insights saved."}

## 9. AI-Assisted Notes Under Review
${acceptedAiNotes.map((item) => {
  const payload = item.payload as { title?: string; body?: string };
  return `- ${payload.title || "Brief note"}: ${payload.body || item.rationale}`;
}).join("\n") || "- No accepted AI brief notes."}

## 10. Decision Change History
${latestLogs.map((item) => `- ${new Date(item.timestamp).toLocaleString()}: ${item.decisionChange}. Reason: ${item.reason}`).join("\n") || "- No decision log entries."}

## 11. Audit Gaps
- Refresh source dates before publication.
- Check whether high-impact low-confidence assumptions have validation tests.
- Confirm all high-weight score rationales are backed by evidence.
- Verify that online-source candidates, if used, were accepted through the review queue.
`;
}
