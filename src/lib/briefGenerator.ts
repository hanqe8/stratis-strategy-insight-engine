import type { StrategyStore } from "../types/store";
import { formatSourceType } from "./config";
import { calculateOptionTotals, getRecommendedOption } from "./scoring";
import { findSensitivityDrivers } from "./sensitivity";

function escapeTableCell(value: unknown): string {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

function formatProvenance(value: string | undefined): string {
  if (value === "AI") return "AI";
  if (value === "AIEdited") return "AI Edited";
  return "User";
}

function evidenceTableMarkdown(evidence: StrategyStore["evidence"]): string {
  if (!evidence.length) return "- No evidence added yet.";
  const rows = evidence.map((item, index) => {
    const sourceParts = [
      item.sourceTitle,
      formatSourceType(item.sourceType),
      item.sourceDate
    ].filter(Boolean);
    const source = item.sourceUrl
      ? `${sourceParts.join(" · ")} (${item.sourceUrl})`
      : sourceParts.join(" · ");
    return `| ${index + 1} | ${escapeTableCell(item.claim)} | ${escapeTableCell(source)} | ${item.confidence} | ${item.relevance}/5 | ${formatProvenance(item.provenance)} |`;
  });
  return [
    "| S/No. | Evidence | Source | Confidence | Relevance | Tagged Category |",
    "| ---: | --- | --- | --- | --- | --- |",
    ...rows
  ].join("\n");
}

function assumptionTableMarkdown(assumptions: StrategyStore["assumptions"]): string {
  if (!assumptions.length) return "- No high-impact assumptions recorded.";
  const rows = assumptions.map((item, index) => `| ${index + 1} | ${escapeTableCell(item.statement)} |`);
  return [
    "| S/No. | Assumptions |",
    "| ---: | --- |",
    ...rows
  ].join("\n");
}

function premortemTableMarkdown(premortems: StrategyStore["premortems"]): string {
  if (!premortems.length) return "- No pre-mortem items added yet.";
  const rows = premortems.map((item, index) => {
    const details = `${item.failureCause} Mitigation: ${item.mitigation || "Not defined."}`;
    return `| ${index + 1} | ${escapeTableCell(details)} | ${item.likelihood}/5 | ${item.severity}/5 | ${item.likelihood * item.severity} | ${escapeTableCell(item.earlyWarning || "Not defined.")} |`;
  });
  return [
    "| S/No. | Details | Likelihood | Severity | Risk Score | How to Validate |",
    "| ---: | --- | --- | --- | --- | --- |",
    ...rows
  ].join("\n");
}

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
  return `# ${project.title}

## Decision and recommendation
Decision question: ${project.decisionQuestion}

Bottom line: ${recommendation ? `Recommend ${recommendation.optionName}.` : "No recommendation yet. Add options, criteria, and scores."}

Current status: ${project.status}

## Recommendation logic
${recommendation ? `${recommendation.optionName} ranks first in the current weighted model with a ${recommendation.total.toFixed(2)}/5 score.` : "The recommendation is blocked because the scoring model is incomplete."}

## Option scoring
${totals.map((item) => `- #${item.rank} ${item.optionName}: ${item.total.toFixed(2)}/5 weighted score`).join("\n") || "- No scoring model available."}

## Watch-outs
${weakAssumptions.map((item) => `- High-impact low-confidence assumption: ${item.statement}`).join("\n") || "- No high-impact low-confidence assumptions flagged."}

## Next actions
- Validate the top assumptions before final executive review.
- Review scoring rationales for the highest-weight criteria.
- Refresh evidence dates before publishing the recommendation.

## Key assumptions
${assumptionTableMarkdown(highImpactAssumptions)}

## Sensitivity
${sensitivityDrivers.length ? `Top sensitivity drivers: ${sensitivityDrivers.join(", ")}.` : "No recommendation-flipping driver identified in the +/-20 point criterion test."}

## Pre-mortem
${premortemTableMarkdown(premortems)}

## Evidence base
${evidenceTableMarkdown(evidence)}
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
  const weakAssumptions = assumptions.filter(
    (item) => item.impact === "High" && item.confidence === "Low"
  );
  const chartInsights = store.chartInsights.filter((item) => item.projectId === projectId);
  const acceptedAiNotes = store.aiCandidates.filter(
    (item) => item.projectId === projectId && item.status === "Accepted" && item.kind === "BriefNote"
  );
  return `# ${project.title} - Detailed Decision Rationale

## 1. Decision Context
- Decision question: ${project.decisionQuestion || "Not defined."}
- Project type: ${project.type}
- Time horizon: ${project.timeHorizon || "Not defined."}
- Owner: ${project.owner || "Not defined."}
- Status: ${project.status}

## 2. Recommendation Logic
${recommendation ? `The current model recommends ${recommendation.optionName} with a weighted score of ${recommendation.total.toFixed(2)}/5.` : "No recommendation is available because the model is incomplete."}

## 3. Option Scoring
Ranking:
${totals.map((item) => `- #${item.rank}: ${item.optionName} at ${item.total.toFixed(2)}/5; missing scores: ${item.missingScores}`).join("\n") || "- No options scored."}

## 4. Watch-Outs
${weakAssumptions.map((item) => `- High-impact low-confidence assumption: ${item.statement}`).join("\n") || "- No high-impact low-confidence assumptions flagged."}

## 5. Next Actions
- Validate high-impact assumptions and unresolved AI-generated claims before final publication.
- Review score rationales for the highest-weight criteria.
- Refresh source dates and document references before executive circulation.

## 6. Evidence Trail
${evidenceTableMarkdown(evidence)}

## 7. Assumption and Uncertainty Ledger
${assumptionTableMarkdown(assumptions)}

## 8. Scoring Method
Criteria:
${criteria.map((item) => `- ${item.name}: ${item.weight}%`).join("\n") || "- No criteria entered."}

Score rationales:
${scores.map((score) => {
  const option = options.find((item) => item.id === score.optionId);
  const criterion = criteria.find((item) => item.id === score.criterionId);
  return `- ${option?.name ?? score.optionId} / ${criterion?.name ?? score.criterionId}: ${score.score}/5. ${score.rationale || "No rationale entered."}`;
}).join("\n") || "- No scores entered."}

## 9. Sensitivity and What Could Change the Answer
${findSensitivityDrivers(options, criteria, scores).length
    ? `Potential recommendation-changing drivers: ${findSensitivityDrivers(options, criteria, scores).join(", ")}.`
    : "No recommendation-changing driver found in the default +/-20 point test."}

## 10. Risk Pre-mortem
${premortemTableMarkdown(premortems)}

## 11. Financial and Market Signals
${chartInsights.map((item) => `- ${item.title}: ${item.summary}`).join("\n") || "- No chart insights saved."}

## 12. AI-Assisted Notes Under Review
${acceptedAiNotes.map((item) => {
  const payload = item.payload as { title?: string; body?: string };
  return `- ${payload.title || "Brief note"}: ${payload.body || item.rationale}`;
}).join("\n") || "- No accepted AI brief notes."}

## 13. Audit Gaps
- Refresh source dates before publication.
- Check whether high-impact low-confidence assumptions have validation tests.
- Confirm all high-weight score rationales are backed by evidence.
- Verify that online-source candidates, if used, were accepted through the review queue.
`;
}
