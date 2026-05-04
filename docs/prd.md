# PRD: Stratis - Strategy & Insight Engine

## Problem Statement

Strategy, product, finance, and executive users often need to turn ambiguous questions into decision-ready recommendations, but the supporting workflow is fragmented across notes, spreadsheets, documents, charts, and slide drafts. This makes it hard to preserve evidence trails, expose weak assumptions, audit scoring logic, test sensitivity, and explain why a recommendation changed over time.

Stratis solves this by providing a browser-based strategy workbench where evidence, assumptions, strategic options, financial metrics, AI-assisted extraction, and executive brief generation share a common project data model.

## Solution

Stratis - Strategy & Insight Engine is a static React application deployable to GitHub Pages. It lets users create strategy projects, upload text-extractable source documents, extract structured AI candidates through a user-provided OpenRouter API key, review and edit those candidates before acceptance, build weighted option models, run sensitivity checks, manage pre-mortems, analyze CSV metrics, and generate executive-ready or detailed briefs.

The product principle is auditability first: AI output is staged, provenance is tracked, assumptions are visible, scoring is inspectable, and generated recommendations are derived from accepted project inputs rather than hidden state.

## User Stories

1. As a strategy professional, I want to create a project with a decision question, so that all analysis is anchored to a clear executive decision.
2. As a strategy professional, I want to classify a project by type and status, so that I can manage different strategy workflows consistently.
3. As a strategy professional, I want project types and statuses to be configurable, so that the app fits my own operating model.
4. As a strategy professional, I want configurable source categories, so that evidence classification can evolve with the project.
5. As a user, I want duplicate configuration checks to ignore case and spacing, so that I do not accidentally create equivalent dropdown values.
6. As a user, I want project fields to wrap and grow vertically, so that long titles, owners, and horizons remain readable.
7. As a researcher, I want to add evidence manually, so that I can record source-grounded claims and implications.
8. As a researcher, I want evidence relevance to be scored from 1 to 5, so that decision-critical evidence is separated from background context.
9. As a researcher, I want the LLM to propose evidence relevance, so that extracted evidence is triaged against the decision question.
10. As a researcher, I want to filter evidence by source type and confidence, so that I can inspect source quality quickly.
11. As a researcher, I want accepted evidence dates to populate automatically, so that generated briefs include useful citation metadata.
12. As a researcher, I want uncertain source dates to be recorded with notes, so that date ambiguity is not hidden.
13. As a strategy professional, I want to record assumptions with impact and confidence, so that uncertainty is explicit.
14. As a strategy professional, I want high-impact low-confidence assumptions highlighted, so that executive risk is visible.
15. As a strategy professional, I want assumptions linked to evidence, so that the basis for each assumption can be audited.
16. As a strategy professional, I want to add strategic options, so that alternative paths can be compared.
17. As a strategy professional, I want to add weighted criteria, so that evaluation logic is explicit.
18. As a strategy professional, I want criterion weights to sum to 100%, so that scoring is coherent.
19. As a strategy professional, I want weighted totals to recalculate automatically, so that recommendation ranking reflects current inputs.
20. As a strategy professional, I want to delete options and criteria with confirmation, so that matrix edits are deliberate.
21. As a strategy professional, I want provenance badges on user and AI-created items, so that I can distinguish source of input.
22. As a strategy professional, I want compact provenance labels, so that dense matrix views remain readable.
23. As a strategy professional, I want edited AI items to revert to AI-generated provenance when restored to original output, so that provenance reflects current state.
24. As a strategy professional, I want sensitivity checks over selected criteria, so that I can understand what could change the recommendation.
25. As a strategy professional, I want sensitivity inputs to support sliders and manual percentages, so that scenario testing is precise.
26. As a strategy professional, I want a pre-mortem builder, so that failure modes, mitigations, and early warnings are captured before recommendation.
27. As a finance or product analyst, I want to upload CSV files, so that I can preview metrics and charts without a backend.
28. As an analyst, I want chart insights to be saved as evidence, so that quantitative analysis can flow into the brief.
29. As a user, I want to upload text-extractable PDFs, DOCX, CSV, TXT, MD, and JSON files, so that common research materials can be analyzed in-browser.
30. As a user, I want document limitations to be explicit, so that I understand OCR, scanned PDF, table extraction, and password-protection constraints.
31. As a privacy-conscious user, I want original uploaded files not to be retained, so that the app stores only extracted text and structured output.
32. As a privacy-conscious user, I want to purge extracted text, so that I can reduce local retained data after review.
33. As a user, I want an OpenRouter API key stored only for the browser session, so that no secret is committed or persisted unnecessarily.
34. As a user, I want OpenRouter model metadata retrieval, so that I can select from available models.
35. As a user, I want AI extraction progress and error states, so that I know whether document analysis is running, complete, or failed.
36. As a user, I want optional public web search during AI analysis, so that uploaded material can be cross-referenced with current sources.
37. As a user, I want online findings staged for review, so that web-sourced claims never affect the project automatically.
38. As a user, I want the AI Review Queue to appear only when pending items exist, so that completed work does not leave stale UI behind.
39. As a user, I want the AI Review Queue organized by category, so that large extraction batches are manageable.
40. As a user, I want one active review item shown beside a tasklist, so that review is focused and not a long scrolling page.
41. As a user, I want to edit AI review candidates before accepting, so that useful extraction can be corrected without restarting.
42. As a user, I want to reject AI candidates, so that low-quality extraction does not pollute the project.
43. As an executive reviewer, I want an executive brief that starts with the decision and recommendation, so that the bottom line is visible immediately.
44. As an executive reviewer, I want evidence shown lower in the brief, so that the logic can be audited after the recommendation.
45. As an analyst, I want a detailed brief mode, so that I can inspect the reasoning trail and supporting analysis.
46. As a user, I want Markdown and formatted text preview modes, so that I can inspect both export syntax and readable output.
47. As a user, I want Markdown export, so that I can reuse the brief in docs, GitHub, or external writing tools.
48. As a user, I want JSON import and export, so that browser-local projects can be backed up and restored.
49. As a user, I want local persistence, so that refreshing the browser does not delete draft work.
50. As a user, I want destructive actions confirmed, so that accidental data loss is less likely.
51. As a reviewer, I want sample projects, so that the product demonstrates realistic strategy use cases immediately.
52. As a portfolio reviewer, I want the repository to include product, architecture, scoring, evidence, AI workflow, roadmap, and review documentation, so that I can understand product and engineering intent quickly.

## Implementation Decisions

- Use React, Vite, TypeScript, and Tailwind CSS for a static GitHub Pages-compatible single-page application.
- Use client-side state with IndexedDB through Dexie, with fallback storage behavior where needed.
- Keep business logic in dedicated library modules for scoring, sensitivity, CSV parsing, storage, OpenRouter integration, document ingestion, and brief generation.
- Keep shared project, evidence, decision, AI, store, and provenance types in typed model modules.
- Use browser-only document ingestion for text-extractable files; do not retain original uploads.
- Use pdfjs-dist for text-extractable PDFs and Mammoth for DOCX text extraction.
- Use OpenRouter with a user-provided session API key; do not require a server, backend secret, or committed API key.
- Treat AI extraction output as candidates in a human review queue rather than directly mutating project data.
- Track provenance as user input, AI generated, or AI generated with user edits.
- Compare AI candidate current state with original AI output to determine whether edited provenance should be applied.
- Normalize backend-safe source categories while displaying user-friendly labels in the frontend.
- Generate executive and detailed briefs deterministically from accepted project state.
- Keep recommendation ranking dynamic while users edit accepted inputs; exported Markdown and JSON are snapshots.
- Use GitHub Actions to build, test, and deploy the static site to GitHub Pages.

## Testing Decisions

- Unit tests should focus on externally visible behavior rather than component implementation details.
- Scoring tests should verify weighted totals, ranking, missing scores, and valid weight behavior.
- Sensitivity tests should verify criterion adjustment and recommendation-change detection.
- Brief generation tests should verify executive BLUF structure and detailed section coverage.
- Config tests should verify normalization and duplicate detection across case and spacing.
- Document ingestion tests should verify chunking and token-estimation behavior.
- Future tests should cover AI candidate provenance reversion, source category canonicalization, and review queue visibility.

## Out of Scope

- User login and multi-user collaboration.
- Server-side databases or private backend storage.
- Server-side API proxying for OpenRouter.
- Committed API keys or mock secrets.
- Confidential document ingestion in the public repository.
- OCR for scanned PDFs or image-only reports.
- Complex PDF table reconstruction.
- Automated live market data feeds.
- Fully autonomous AI updates without human review.
- Enterprise permissions, audit logging, or compliance controls.

## Further Notes

The product should remain an executive decision-support workbench rather than a generic summarizer. Future versions can add stronger score recommendation guardrails, explicit no-go thresholds, AI evaluation checklists, richer source quality scoring, and GitHub Pages demo screenshots or GIFs.

