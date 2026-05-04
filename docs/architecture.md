# Architecture

## Runtime

The app is a Vite single-page React application deployable to GitHub Pages. It uses hash-compatible client-side state and does not require a backend.

## State Model

The shared workflow model is:

Project -> Evidence -> Assumptions -> Options -> Scores -> Briefs -> Decision Logs

The current MVP stores this model in IndexedDB with a LocalStorage fallback and supports full JSON export/import for backup.

## Source Layout

- `src/types`: domain model contracts.
- `src/lib`: pure business logic for scoring, sensitivity, CSV summaries, persistence, and brief generation.
- `src/lib/documentIngestion.ts`: dynamically loaded PDF/DOCX/text extraction and chunking.
- `src/lib/openRouter.ts`: OpenRouter model metadata fetches and structured extraction calls.
- `src/data`: synthetic sample projects and sample financial CSV.
- `src/app`: application shell and workspaces.
- `src/tests`: unit tests for calculation logic.
