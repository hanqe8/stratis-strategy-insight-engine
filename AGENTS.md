# AGENTS.md

## Product context

This repository contains Stratis - Strategy & Insight Engine, a static web app for executive strategy analysis, evidence management, option scoring, financial/market analysis, and briefing generation.

The app is a portfolio-grade product artifact. It should demonstrate product/platform thinking, auditability, responsive design, and code quality.

## Constraints

- Must deploy to GitHub Pages as a static site.
- No backend dependency for MVP.
- No committed secrets.
- Use synthetic or public sample data only.
- Do not require external APIs for core functionality.
- Optional AI features must be isolated and disabled by default.

## Engineering standards

- React + TypeScript + Vite.
- TypeScript strict mode.
- Prefer small, typed, reusable components.
- Keep business logic in `src/lib`.
- Keep data model types in `src/types`.
- Add unit tests for scoring, sensitivity, and brief generation logic.
- Ensure desktop, tablet, and mobile responsiveness.

## Product standards

Every major feature should support the core decision workflow:

Evidence -> Assumptions -> Options -> Scores -> Sensitivity -> Pre-mortem -> Brief -> Decision Log

Do not build generic summarisation features unless they strengthen this workflow.

## Review checklist

- Does it preserve static-site compatibility?
- Does it avoid secrets and confidential data?
- Is the UI usable on mobile?
- Are calculations tested?
- Is the recommendation logic auditable?
- Are uncited or weakly supported claims flagged where relevant?
