# Stratis - Strategy & Insight Engine

A static, browser-based executive strategy workbench for turning evidence, assumptions, weighted options, financial inputs, and risks into decision-ready briefings with citations and auditable scoring logic.

## What It Demonstrates

- Structured strategy workflow: Evidence -> Assumptions -> Options -> Scores -> Sensitivity -> Pre-mortem -> Brief -> Decision Log.
- Productised decision support rather than a generic summariser.
- Static-site architecture suitable for GitHub Pages.
- Local browser persistence, JSON backup, Markdown export, and no required backend.
- TypeScript business logic with unit tests for scoring and sensitivity.

## Product Documentation

- `docs/prd.md` - product requirements document.
- `docs/product-brief.md` - product thesis and positioning.
- `docs/architecture.md` - static app architecture and module boundaries.
- `docs/evidence-standard.md` - evidence quality and citation standard.
- `docs/scoring-methodology.md` - option scoring and sensitivity methodology.
- `docs/ai-workflow-design.md` - AI review, provenance, and OpenRouter workflow.
- `docs/roadmap.md` - staged release plan.
- `examples/asean-digital-wealth-market-entry.json` - importable sample workspace for the ASEAN Digital Wealth Market Entry demo, with no API keys or retained source documents.

## MVP Features

- Create, edit, duplicate, and delete projects.
- Evidence workspace with source type, claim, implication, confidence, relevance, and citation-ready fields.
- Assumption ledger with impact, confidence, validation, invalidation, and linked evidence.
- Weighted option scoring matrix with automatic ranking.
- Sensitivity checker for criterion weight changes.
- Pre-mortem builder sorted by likelihood x severity.
- CSV upload, responsive charts, summary statistics, and chart insight capture.
- Browser-side document ingestion for text-extractable PDF, DOCX, CSV, TXT, MD, and JSON files.
- OpenRouter-backed AI extraction with a session-only user API key and staged review queue.
- Optional OpenRouter web search during analysis, with online-source findings staged for review.
- Configurable project Type and Status dropdown values with duplicate detection.
- Deterministic executive brief generator with Markdown export.
- Brief Preview toggle for executive-ready or detailed rationale views.
- LocalStorage persistence, project JSON import/export, print-friendly brief view.
- Three synthetic sample projects:
  - ASEAN Digital Wealth Market Entry
  - Healthcare Workflow AI Command Centre
  - Semiconductor Macro Brief

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS
- Recharts
- Papa Parse
- Dexie / IndexedDB
- pdfjs-dist and Mammoth for client-side text extraction
- Vitest
- GitHub Actions for GitHub Pages

## Local Development

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run test
npm run build
```

## Deployment

The repository includes `.github/workflows/deploy.yml`, which builds the Vite app and publishes the `dist` artifact to GitHub Pages. In repository settings, set Pages source to GitHub Actions.

Vite automatically uses `/<repo-name>/` as the base path when `GITHUB_REPOSITORY` is present in CI.

## Privacy And Safety

This is a static GitHub Pages app. Do not commit confidential data, customer documents, real API keys, or proprietary analysis.

OpenRouter API keys are stored in `sessionStorage` only. Original uploaded files are not retained by default; the app stores extracted text chunks, source filenames, and structured AI outputs so users can audit citations. Users can purge extracted text after generating and reviewing evidence.

v1 document limitations: no OCR, no scanned/image-only PDFs, no password-protected files, and no guaranteed PDF table reconstruction.
