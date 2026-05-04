# AI Workflow Design

The v0.1 app keeps deterministic template mode as the default source of truth, and adds optional OpenRouter-powered extraction using a user-supplied API key.

BYO API key mode follows these constraints:

- User-entered keys are session-only by default.
- No keys are committed, logged, or persisted in repository files.
- AI output must preserve citations, assumption flags, and weak-evidence warnings.
- Human review remains required before export or publication.

The LLM proposes evidence, assumptions, options, criteria, risks, decision-log entries, and brief notes. Candidates are staged in the AI Review Queue and must be accepted by the user before they affect the project.

Scoring proposals must include original value, proposed value, rationale, why the proposal is better, confidence, and source references when modifying existing scoring logic.

Optional web search uses OpenRouter's `openrouter:web_search` server tool. Web-derived findings must be returned as staged evidence candidates with source URLs and rationales, not committed automatically. The UI warns that this beta server tool may add search and token costs.
