# Product Requirements Document: Stratis — Strategy & Insight Engine

## 1. Product Summary

**Stratis — Strategy & Insight Engine** is a browser-based executive strategy workbench for turning evidence, assumptions, strategic options, financial metrics, AI-assisted extraction, and executive brief generation into one auditable decision workflow.

The product is designed for strategy, product, finance, and executive users who need to convert ambiguous questions into decision-ready recommendations while preserving the reasoning trail behind those recommendations.

The core workflow is:

> Evidence → Assumptions → Options → Scores → Sensitivity → Pre-mortem → Brief → Decision Log

Stratis is built as a static React application deployable to GitHub Pages. It uses browser-side document ingestion, local persistence, deterministic brief generation, and optional AI-assisted extraction through a user-provided OpenRouter API key.

---

## 2. Problem Statement

Strategy, product, finance, and executive decision workflows are often fragmented across notes, spreadsheets, source documents, charts, AI prompts, and slide drafts.

This fragmentation creates several recurring problems:

- Evidence is separated from recommendations.
- Assumptions are not always visible or tested.
- Scoring logic is difficult to inspect.
- Sensitivity analysis is often omitted or lost.
- AI-generated outputs may be adopted without review.
- Recommendation changes are hard to trace over time.
- Executive briefs may sound polished but lack an auditable reasoning trail.

The result is a weak decision-support workflow: recommendations may be persuasive, but the basis for those recommendations is difficult to review, challenge, or improve.

---

## 3. Product Objective

Stratis aims to provide a structured, browser-based strategy workbench where users can:

1. Define a clear decision question.
2. Ingest and organise source material.
3. Extract and review candidate evidence.
4. Track assumptions and uncertainty.
5. Compare strategic options through weighted criteria.
6. Run sensitivity checks.
7. Capture pre-mortem risks and mitigations.
8. Generate executive-ready and detailed briefs.
9. Export briefs and project data.
10. Preserve an auditable decision trail.

The product principle is:

> **Auditability first.**

AI output should be staged, provenance should be tracked, assumptions should be visible, scoring should be inspectable, and generated recommendations should be derived from accepted project inputs rather than hidden state.

---

## 4. Target Users

### 4.1 Primary Users

| User | Core Need |
|---|---|
| Strategy professional | Convert ambiguous business questions into executive-ready recommendations. |
| Product manager | Compare roadmap, feature, platform, or workflow options using explicit criteria. |
| Finance or market analyst | Link evidence, metrics, assumptions, and scenarios into decision-ready analysis. |
| Executive reviewer | Inspect recommendation logic, assumptions, risks, and evidence without reading every source document. |

### 4.2 Secondary Users

| User | Core Need |
|---|---|
| Consultant | Build auditable market-entry, growth, transformation, or operating-model recommendations. |
| Programme lead | Track decision rationale, risks, and assumptions across complex initiatives. |
| Portfolio reviewer | Assess the product as a demonstration of product, platform, AI, and decision-system thinking. |

---

## 5. Scope

### 5.1 In Scope

Stratis will support:

- Project creation and management.
- Configurable project types, project statuses, and source categories.
- Manual evidence entry.
- Evidence relevance and confidence scoring.
- Assumption ledger with impact and confidence.
- Weighted option scoring matrix.
- Sensitivity analysis.
- Pre-mortem builder.
- CSV upload and basic charting.
- Browser-side document ingestion.
- Optional OpenRouter-based AI extraction.
- AI review queue.
- Provenance tracking for user-created and AI-generated inputs.
- Executive and detailed brief generation.
- Markdown export.
- JSON import and export.
- Local browser persistence.
- GitHub Pages deployment.

### 5.2 Out of Scope

Stratis will not support in the current version:

- User login.
- Multi-user collaboration.
- Server-side database storage.
- Private backend storage.
- Server-side API proxying.
- Committed API keys or mock secrets.
- Confidential document ingestion in the public repository.
- OCR for scanned PDFs or image-only reports.
- Complex PDF table reconstruction.
- Automated live market data feeds.
- Fully autonomous AI updates without human review.
- Enterprise-grade permissions, audit logs, or compliance controls.

---

## 6. Product Principles

### 6.1 Auditability First

Every recommendation should be traceable to accepted evidence, assumptions, scoring logic, sensitivity checks, and risks.

### 6.2 Human Review Before AI Adoption

AI-generated outputs should be staged as candidates. Users must review, edit, accept, or reject candidates before they affect the project.

### 6.3 Visible Assumptions

Material assumptions should be explicit, scored by impact and confidence, and linked to supporting evidence where possible.

### 6.4 Inspectable Scoring

Option rankings should be based on visible criteria, weights, scores, and rationales. Weighted totals should recalculate dynamically as users edit inputs.

### 6.5 Static-first Architecture

The MVP should remain deployable as a static GitHub Pages application without backend dependencies or committed secrets.

### 6.6 Executive-first Communication

Briefs should start with the decision, recommendation, and rationale before moving into supporting evidence and detailed analysis.

---

## 7. Core User Workflow

1. User creates a project with a decision question.
2. User configures project type, status, owner, and time horizon.
3. User uploads source documents or enters evidence manually.
4. The app extracts text chunks from supported documents.
5. Optional AI extraction proposes structured evidence, assumptions, options, and risks.
6. User reviews, edits, accepts, or rejects AI candidates.
7. User builds an evidence base.
8. User records assumptions and uncertainty drivers.
9. User defines strategic options and weighted evaluation criteria.
10. User scores options and reviews weighted ranking.
11. User runs sensitivity checks.
12. User creates a pre-mortem.
13. User generates an executive or detailed brief.
14. User exports the brief as Markdown or exports the project as JSON.

---

## 8. Functional Requirements

### 8.1 Project Management

#### Requirements

- Users can create, edit, duplicate, and delete projects.
- Projects must include a decision question.
- Projects can include type, status, owner, time horizon, and notes.
- Project types and statuses should be configurable.
- Long project fields should wrap and grow vertically.

#### User Stories

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

#### Acceptance Criteria

- A project cannot be created without a decision question.
- Project type and status values can be configured.
- Duplicate configuration values are prevented through normalization.
- Project metadata remains readable on desktop, tablet, and mobile layouts.

---

### 8.2 Configuration Management

#### Requirements

- Users can configure project types, statuses, and source categories.
- Duplicate configuration checks must ignore case and spacing.
- Source categories should use backend-safe normalized values while displaying user-friendly labels.

#### User Stories

- As a strategy professional, I want configurable source categories so that evidence classification can evolve with the project.
- As a user, I want duplicate configuration checks to ignore case and spacing so that I do not accidentally create equivalent dropdown values.

#### Acceptance Criteria

- `Official Source`, `official source`, and `OfficialSource` should be treated as duplicates where relevant.
- User-facing labels remain readable even when stored values are normalized.
- Configuration changes do not corrupt existing project records.

---

### 8.3 Evidence Workspace

#### Requirements

- Users can add evidence manually.
- Evidence must include source type, claim, implication, confidence, relevance, and notes.
- Evidence relevance should be scored from 1 to 5.
- Evidence can be filtered by source type, confidence, and relevance.
- Accepted evidence dates should populate automatically where available.
- Uncertain source dates should be recorded with notes.

#### User Stories

- As a researcher, I want to add evidence manually so that I can record source-grounded claims and implications.
- As a researcher, I want evidence relevance to be scored from 1 to 5 so that decision-critical evidence is separated from background context.
- As a researcher, I want the LLM to propose evidence relevance so that extracted evidence is triaged against the decision question.
- As a researcher, I want to filter evidence by source type and confidence so that I can inspect source quality quickly.
- As a researcher, I want uncertain source dates to be recorded with notes so that date ambiguity is not hidden.

#### Acceptance Criteria

- Evidence items can be created, edited, deleted, filtered, and reviewed.
- Evidence relevance is visible in evidence tables.
- Evidence dates appear in generated briefs where available.
- Uncertain dates are not silently converted into false precision.

---

### 8.4 Assumption Ledger

#### Requirements

- Users can record assumptions with impact and confidence.
- High-impact, low-confidence assumptions should be highlighted.
- Assumptions can be linked to evidence.
- Assumptions should include validation and invalidation tests.

#### User Stories

- As a strategy professional, I want to record assumptions with impact and confidence so that uncertainty is explicit.
- As a strategy professional, I want high-impact low-confidence assumptions highlighted so that executive risk is visible.
- As a strategy professional, I want assumptions linked to evidence so that the basis for each assumption can be audited.

#### Acceptance Criteria

- Assumptions include impact, confidence, validation test, invalidation trigger, and linked evidence.
- High-impact, low-confidence assumptions are visually flagged.
- Generated briefs include material assumptions and uncertainty drivers.

---

### 8.5 Option Scoring Matrix

#### Requirements

- Users can add strategic options.
- Users can add weighted evaluation criteria.
- Criteria weights must sum to 100%.
- Users can score options against criteria.
- Weighted totals should recalculate automatically.
- Options and criteria can be deleted with confirmation.

#### User Stories

- As a strategy professional, I want to add strategic options so that alternative paths can be compared.
- As a strategy professional, I want to add weighted criteria so that evaluation logic is explicit.
- As a strategy professional, I want criterion weights to sum to 100% so that scoring is coherent.
- As a strategy professional, I want weighted totals to recalculate automatically so that recommendation ranking reflects current inputs.
- As a strategy professional, I want to delete options and criteria with confirmation so that matrix edits are deliberate.

#### Acceptance Criteria

- The app warns users when weights do not sum to 100%.
- Weighted scores update immediately after edits.
- Option rankings are visible and explainable.
- Destructive edits require confirmation.

---

### 8.6 Provenance Tracking

#### Requirements

- Items should be labelled by provenance:
  - User-created
  - AI-generated
  - AI-generated with user edits
- Provenance labels should remain compact in dense views.
- Edited AI items should revert to AI-generated provenance if restored to their original AI output.

#### User Stories

- As a strategy professional, I want provenance badges on user and AI-created items so that I can distinguish source of input.
- As a strategy professional, I want compact provenance labels so that dense matrix views remain readable.
- As a strategy professional, I want edited AI items to revert to AI-generated provenance when restored to original output so that provenance reflects current state.

#### Acceptance Criteria

- Provenance appears in evidence, assumptions, options, risks, and AI review outputs.
- Provenance updates correctly after user edits.
- Dense tables remain readable with compact provenance labels.

---

### 8.7 Sensitivity Analysis

#### Requirements

- Users can run sensitivity checks over selected criteria.
- Sensitivity inputs should support sliders and manual percentages.
- The app should identify whether changes alter the top-ranked recommendation.

#### User Stories

- As a strategy professional, I want sensitivity checks over selected criteria so that I can understand what could change the recommendation.
- As a strategy professional, I want sensitivity inputs to support sliders and manual percentages so that scenario testing is precise.

#### Acceptance Criteria

- Users can select a criterion and adjust its weighting.
- Rankings recalculate under the adjusted scenario.
- The app identifies whether the recommendation changes.
- Generated briefs include material sensitivity findings.

---

### 8.8 Pre-mortem Builder

#### Requirements

- Users can define failure modes, mitigations, and early warning indicators.
- Risks should include likelihood and severity.
- Risks should be sortable by risk score.

#### User Stories

- As a strategy professional, I want a pre-mortem builder so that failure modes, mitigations, and early warnings are captured before recommendation.

#### Acceptance Criteria

- Users can add at least five pre-mortem items.
- Risk score is calculated from likelihood and severity.
- Top risks appear in the executive brief.

---

### 8.9 CSV Metrics and Charting

#### Requirements

- Users can upload CSV files.
- Users can preview uploaded metric data.
- Users can generate basic charts.
- Users can save chart insights as evidence.

#### User Stories

- As a finance or product analyst, I want to upload CSV files so that I can preview metrics and charts without a backend.
- As an analyst, I want chart insights to be saved as evidence so that quantitative analysis can flow into the brief.

#### Acceptance Criteria

- CSV data can be previewed in-browser.
- Users can select basic x-axis and y-axis fields.
- Charts render responsively.
- Chart insights can be saved as evidence.

---

### 8.10 Document Ingestion

#### Requirements

- Users can upload common text-extractable files:
  - PDF
  - DOCX
  - CSV
  - TXT
  - Markdown
  - JSON
- Document limitations must be explicit.
- Original uploaded files should not be retained.
- Users should be able to purge extracted text.

#### User Stories

- As a user, I want to upload text-extractable PDFs, DOCX, CSV, TXT, MD, and JSON files so that common research materials can be analysed in-browser.
- As a user, I want document limitations to be explicit so that I understand OCR, scanned PDF, table extraction, and password-protection constraints.
- As a privacy-conscious user, I want original uploaded files not to be retained so that the app stores only extracted text and structured output.
- As a privacy-conscious user, I want to purge extracted text so that I can reduce local retained data after review.

#### Acceptance Criteria

- Supported files can be uploaded and parsed in-browser.
- Unsupported files produce clear error messages.
- Original uploaded files are not retained.
- Extracted chunks can be purged.

---

### 8.11 AI Extraction and Review Queue

#### Requirements

- Users can provide an OpenRouter API key for optional AI extraction.
- The API key should be stored only for the browser session.
- The app can retrieve OpenRouter model metadata.
- AI extraction progress and error states should be visible.
- Optional public web search can be used during AI analysis.
- Web-sourced findings must be staged for review.
- AI review candidates should be grouped by category.
- The review queue should appear only when pending items exist.
- Users can edit, accept, or reject AI candidates.

#### User Stories

- As a user, I want an OpenRouter API key stored only for the browser session so that no secret is committed or persisted unnecessarily.
- As a user, I want OpenRouter model metadata retrieval so that I can select from available models.
- As a user, I want AI extraction progress and error states so that I know whether document analysis is running, complete, or failed.
- As a user, I want optional public web search during AI analysis so that uploaded material can be cross-referenced with current sources.
- As a user, I want online findings staged for review so that web-sourced claims never affect the project automatically.
- As a user, I want the AI Review Queue to appear only when pending items exist so that completed work does not leave stale UI behind.
- As a user, I want the AI Review Queue organised by category so that large extraction batches are manageable.
- As a user, I want one active review item shown beside a task list so that review is focused and not a long scrolling page.
- As a user, I want to edit AI review candidates before accepting so that useful extraction can be corrected without restarting.
- As a user, I want to reject AI candidates so that low-quality extraction does not pollute the project.

#### Acceptance Criteria

- AI extraction requires explicit user action.
- AI output enters the review queue, not the accepted project state.
- Users can accept, reject, or edit candidates.
- Completed queues disappear or collapse.
- Errors are visible and actionable.

---

### 8.12 Brief Generation

#### Requirements

- Users can generate executive and detailed briefs.
- Executive briefs should start with the decision and recommendation.
- Evidence should appear after the recommendation.
- Detailed mode should expose the reasoning trail.
- Users can preview Markdown and formatted text.
- Users can export briefs in Markdown.

#### User Stories

- As an executive reviewer, I want an executive brief that starts with the decision and recommendation so that the bottom line is visible immediately.
- As an executive reviewer, I want evidence shown lower in the brief so that the logic can be audited after the recommendation.
- As an analyst, I want a detailed brief mode so that I can inspect the reasoning trail and supporting analysis.
- As a user, I want Markdown and formatted text preview modes so that I can inspect both export syntax and readable output.
- As a user, I want Markdown export so that I can reuse the brief in docs, GitHub, or external writing tools.

#### Acceptance Criteria

- Executive mode starts with decision, recommendation, and rationale.
- Detailed mode includes evidence, assumptions, scoring, sensitivity, and pre-mortem.
- Markdown export works reliably.
- Generated briefs are based on accepted project inputs.

---

### 8.13 Import, Export, and Persistence

#### Requirements

- Users can export and import project JSON.
- Users can save work locally in the browser.
- Refreshing the browser should not delete draft work.
- Destructive actions require confirmation.

#### User Stories

- As a user, I want JSON import and export so that browser-local projects can be backed up and restored.
- As a user, I want local persistence so that refreshing the browser does not delete draft work.
- As a user, I want destructive actions confirmed so that accidental data loss is less likely.

#### Acceptance Criteria

- Projects persist after refresh.
- Project JSON can be exported and re-imported.
- Destructive actions require confirmation.
- Imported project data is validated before acceptance.

---

### 8.14 Sample Projects and Portfolio Documentation

#### Requirements

- The application should include realistic sample projects.
- The repository should include product, architecture, scoring, evidence, AI workflow, roadmap, and review documentation.

#### User Stories

- As a reviewer, I want sample projects so that the product demonstrates realistic strategy use cases immediately.
- As a portfolio reviewer, I want the repository to include product, architecture, scoring, evidence, AI workflow, roadmap, and review documentation so that I can understand product and engineering intent quickly.

#### Acceptance Criteria

- At least three sample projects are available.
- Sample data is synthetic or public-reference style.
- Documentation is linked from the README.
- Repository structure is understandable to product and technical reviewers.

---

## 9. Non-functional Requirements

### 9.1 Deployment

- The app must be deployable as a static site to GitHub Pages.
- The app should not require a backend server for core functionality.
- GitHub Actions should build, test, and deploy the static site.

### 9.2 Security and Privacy

- No API keys should be committed.
- No confidential sample data should be included.
- Optional API keys should be session-scoped.
- Original uploaded files should not be retained.
- Extracted text should be purgeable.
- Public demo usage should include privacy warnings.

### 9.3 Performance

- The app should remain responsive with typical strategy project datasets.
- Large document ingestion should show progress or error states.
- Tables and charts should remain usable on desktop, tablet, and mobile.

### 9.4 Accessibility

- The app should use readable typography, sufficient contrast, semantic labels, visible focus states, and keyboard-accessible controls.
- Dense tables should remain navigable and readable.

### 9.5 Maintainability

- Business logic should live in dedicated library modules.
- Shared types should live in typed model modules.
- Tests should focus on externally visible behaviour.
- AI, scoring, ingestion, storage, and brief-generation logic should be separated from UI components where practical.

---

## 10. Implementation Decisions

- Use React, Vite, TypeScript, and Tailwind CSS for a static GitHub Pages-compatible single-page application.
- Use client-side state with IndexedDB through Dexie, with fallback storage behaviour where needed.
- Keep business logic in dedicated library modules for scoring, sensitivity, CSV parsing, storage, OpenRouter integration, document ingestion, and brief generation.
- Keep shared project, evidence, decision, AI, store, and provenance types in typed model modules.
- Use browser-only document ingestion for text-extractable files.
- Do not retain original uploads.
- Use `pdfjs-dist` for text-extractable PDFs.
- Use Mammoth for DOCX text extraction.
- Use OpenRouter with a user-provided session API key.
- Do not require a server, backend secret, or committed API key.
- Treat AI extraction output as candidates in a human review queue rather than directly mutating project data.
- Track provenance as user input, AI generated, or AI generated with user edits.
- Compare AI candidate current state with original AI output to determine whether edited provenance should be applied.
- Normalise backend-safe source categories while displaying user-friendly labels in the frontend.
- Generate executive and detailed briefs deterministically from accepted project state.
- Keep recommendation ranking dynamic while users edit accepted inputs.
- Treat exported Markdown and JSON as snapshots.
- Use GitHub Actions to build, test, and deploy the static site to GitHub Pages.

---

## 11. Testing Strategy

### 11.1 Testing Principles

- Tests should focus on externally visible behaviour.
- Business logic should be tested separately from UI details.
- Tests should prioritise scoring, sensitivity, export, ingestion, and provenance behaviour.

### 11.2 Required Test Coverage

| Test Area | Required Coverage |
|---|---|
| Scoring | Weighted totals, ranking, missing scores, invalid weight handling |
| Sensitivity | Criterion adjustment, ranking recalculation, recommendation-change detection |
| Brief generation | Executive BLUF structure, detailed section coverage, accepted-input sourcing |
| Configuration | Normalisation, duplicate detection across case and spacing |
| Document ingestion | Chunking, token estimation, unsupported file handling |
| Persistence | Project save, reload, export, import |
| Provenance | User-created, AI-generated, AI-edited, provenance reversion |
| Review queue | Visibility, grouping, accept, reject, edit behaviours |

### 11.3 Future Test Coverage

Future versions should add tests for:

- source category canonicalisation;
- AI candidate provenance reversion edge cases;
- review queue visibility after all candidates are processed;
- source date ambiguity handling;
- Markdown export formatting;
- JSON import validation failures;
- large project performance.

---

## 12. Success Metrics

### 12.1 Product Success Metrics

| Metric | Target |
|---|---|
| Time to create a structured project | Under 5 minutes for a sample use case |
| Time to generate first executive brief | Under 10 minutes using sample data |
| Evidence-to-brief traceability | Every key recommendation section can be traced to accepted project inputs |
| Review queue usefulness | AI candidates can be reviewed, edited, accepted, or rejected without disrupting the project |
| Export reliability | Markdown and JSON export work without data loss |

### 12.2 Portfolio Success Metrics

| Metric | Target |
|---|---|
| Repository clarity | A reviewer can understand the product purpose within 3 minutes |
| Documentation completeness | README links to PRD, architecture, evidence standard, scoring methodology, AI workflow, roadmap |
| Technical credibility | Tests and GitHub Actions workflow are visible |
| Product credibility | Screenshots, sample projects, and product rationale are visible |
| Career signal | The project demonstrates strategy, product, platform, AI workflow, and implementation capability |

---

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Product becomes a generic AI summariser | Weak differentiation | Keep the workflow centred on evidence, assumptions, scoring, and auditability |
| Users over-trust AI extraction | Poor decision quality | Stage AI outputs for human review before acceptance |
| Document ingestion feels unreliable | User distrust | Make ingestion limitations explicit and provide clear error states |
| Local storage creates data-loss risk | User loses work | Provide JSON export/import and backup guidance |
| Public demo users upload sensitive data | Privacy risk | Add clear warnings and avoid backend storage |
| Scoring model appears overly mechanical | False precision | Require score rationales and sensitivity analysis |
| README overemphasises technical stack | Weak product signal | Lead with product thesis, users, workflow, and decision utility |

---

## 14. Roadmap

### v0.1 — Core Decision Workflow

- [x] Project creation
- [x] Evidence workspace
- [x] Assumption ledger
- [x] Option scoring
- [x] Sensitivity checks
- [x] Pre-mortem builder
- [x] Executive brief generation
- [x] Local persistence
- [x] Markdown and JSON export

### v0.2 — Document Ingestion and Review

- [x] PDF, DOCX, CSV, TXT, MD, and JSON ingestion
- [x] Retained extracted chunks
- [x] AI extraction candidates
- [x] Review queue
- [x] Provenance tracking
- [x] Source category configuration

### v0.3 — AI Workflow Hardening

- [ ] Better AI extraction prompts
- [ ] Source quality scoring
- [ ] Evidence relevance suggestions
- [ ] Web-search staging
- [ ] Candidate edit/reversion logic
- [ ] AI evaluation checklist

### v0.4 — Financial and Market Analysis

- [ ] Richer CSV charting
- [ ] Financial and operating metric templates
- [ ] Scenario modelling
- [ ] Chart insights as evidence
- [ ] More robust sample projects

### v0.5 — Executive Output and Portfolio Polish

- [ ] Improved print view
- [ ] Executive deck export concept
- [ ] Better README screenshots
- [ ] Demo GIF
- [ ] More complete test corpus
- [ ] Stronger GitHub Pages product demo

---

## 15. Open Questions

1. Should AI extraction remain OpenRouter-only, or should the product support multiple provider adapters?
2. Should web search be kept in the main workflow or moved to an advanced mode?
3. Should source quality scoring be manual, AI-assisted, or hybrid?
4. Should scoring models include no-go thresholds in addition to weighted totals?
5. Should generated briefs flag unsupported claims more aggressively?
6. Should the app support multiple brief templates by use case?
7. Should long-term storage remain browser-local, or should future versions support a private backend?

---

## 16. Future Enhancements

Potential future enhancements include:

- Explicit no-go threshold logic.
- AI evidence quality evaluation checklist.
- Stronger source reliability scoring.
- More advanced sensitivity and scenario modelling.
- Executive deck generation.
- Better citation coverage checks.
- More robust Markdown export formatting.
- Configurable brief templates.
- Private backend option for non-public use.
- Multi-user collaboration for enterprise environments.

---

## 17. Final Product Positioning

Stratis should remain an executive decision-support workbench, not a generic summarisation tool.

Its differentiating value is the structured reasoning system:

> Define the decision, organise the evidence, expose the assumptions, score the options, test the sensitivity, anticipate failure, and generate a recommendation with the reasoning trail intact.
