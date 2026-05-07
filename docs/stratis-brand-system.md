# STRATIS Brand System

Version: 0.1  
Status: Approved design specification

## STRATIS Product Family

STRATIS is a portfolio of decision workbenches for high-stakes operational and strategic reasoning.

STRATIS products are not dashboards first. They are structured tools that help users move from signal or evidence to a reviewable decision, with clear rationale, human judgement, and exportable outputs.

## Product Family Principles

1. **Decision-first**  
   Every product must expose a complete decision loop, not only charts or metrics.

2. **Reviewability as a product feature**  
   Inputs, logic, assumptions, recommendations, decisions, and logs should be inspectable.

3. **Human-in-the-loop**  
   STRATIS supports judgement. It does not replace accountable review.

4. **Structured workbench UI**  
   Interfaces should feel calm, dense, professional, and repeatable.

5. **Domain-specific intelligence**  
   Shared brand system, local domain vocabulary.

6. **Static-first portfolio quality**  
   Public builds should remain easy to run, inspect, document, and deploy.

## Product Naming

- `STRATIS Strategy & Insight Engine`
- `STRATIS Healthcare Ops Command Centre`

## Tagline Pattern

- `Decision workbench for [domain/workflow]`
- `Structured decision support for [workflow]`

Recommended product taglines:

- Strategy: `Decision workbench for evidence-led executive strategy`
- Healthcare: `Command centre for regulated healthcare operations`

## Visual Direction

STRATIS uses a Hybrid Portfolio System:

> A structured white/slate decision workbench system with restrained blue-teal accents, strong review surfaces, and optional darker command-centre treatments for operational products.

Product-specific expression:

- Strategy & Insight Engine should feel more executive and reasoning-led.
- Healthcare Ops Command Centre should feel more operational and queue-led.

## Design Tokens

Canonical design tokens use the `--stratis-*` namespace. Tailwind aliases may exist for implementation ergonomics, but CSS variables remain the source of truth.

### Light Mode

```css
:root {
  --stratis-ink: #14212b;
  --stratis-ink-2: #1a2733;
  --stratis-paper: #f3f6f8;
  --stratis-surface: #ffffff;
  --stratis-surface-soft: #edf3f6;
  --stratis-line: #d7dee6;
  --stratis-muted: #5c6b76;

  --stratis-teal: #18716f;
  --stratis-teal-2: #238b87;
  --stratis-teal-soft: #e6f3f2;

  --stratis-blue: #2563eb;
  --stratis-blue-soft: #e8efff;

  --stratis-gold: #c6922e;
  --stratis-gold-soft: #fff4d8;

  --stratis-danger: #dc2626;
  --stratis-danger-soft: #fee2e2;

  --stratis-warning: #d97706;
  --stratis-warning-soft: #fef3c7;

  --stratis-success: #059669;
  --stratis-success-soft: #d1fae5;

  --stratis-radius-sm: 4px;
  --stratis-radius-md: 6px;
  --stratis-radius-lg: 8px;

  --stratis-shadow-panel: 0 1px 2px rgba(20, 33, 43, 0.08);
  --stratis-shadow-modal: 0 18px 45px rgba(15, 23, 32, 0.24);

  --stratis-focus: #c6922e;
}
```

### Dark Mode

```css
:root.dark {
  --stratis-ink: #edf3f6;
  --stratis-ink-2: #d7e0e6;
  --stratis-paper: #0f1720;
  --stratis-surface: #1a2733;
  --stratis-surface-soft: #111b24;
  --stratis-line: #344655;
  --stratis-muted: #a8b5bf;

  --stratis-teal: #56c7c2;
  --stratis-teal-2: #238b87;
  --stratis-teal-soft: rgba(86, 199, 194, 0.14);

  --stratis-blue: #7aa2ff;
  --stratis-blue-soft: rgba(122, 162, 255, 0.14);

  --stratis-gold: #f2c46d;
  --stratis-gold-soft: rgba(242, 196, 109, 0.14);

  --stratis-danger: #f87171;
  --stratis-danger-soft: rgba(248, 113, 113, 0.14);

  --stratis-warning: #fbbf24;
  --stratis-warning-soft: rgba(251, 191, 36, 0.14);

  --stratis-success: #34d399;
  --stratis-success-soft: rgba(52, 211, 153, 0.14);

  --stratis-shadow-panel: 0 1px 2px rgba(0, 0, 0, 0.28);
  --stratis-shadow-modal: 0 18px 45px rgba(0, 0, 0, 0.42);
}
```

### Typography

```css
--stratis-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

--stratis-text-xs: 0.75rem;
--stratis-text-sm: 0.875rem;
--stratis-text-md: 1rem;
--stratis-text-lg: 1.125rem;
--stratis-text-xl: 1.25rem;
--stratis-text-2xl: 1.5rem;
```

### Chart Tokens

```css
--stratis-chart-primary: var(--stratis-teal);
--stratis-chart-secondary: var(--stratis-blue);
--stratis-chart-highlight: var(--stratis-gold);
--stratis-chart-grid: var(--stratis-line);
--stratis-chart-tick: var(--stratis-muted);
--stratis-chart-tooltip-bg: var(--stratis-ink);
--stratis-chart-tooltip-text: #ffffff;
```

### Tailwind Alias Guidance

Implementation may expose shorter Tailwind names:

```ts
colors: {
  ink: "var(--stratis-ink)",
  paper: "var(--stratis-paper)",
  surface: "var(--stratis-surface)",
  "surface-soft": "var(--stratis-surface-soft)",
  line: "var(--stratis-line)",
  muted: "var(--stratis-muted)",
  teal: "var(--stratis-teal)",
  blue: "var(--stratis-blue)",
  gold: "var(--stratis-gold)",
  danger: "var(--stratis-danger)",
  warning: "var(--stratis-warning)",
  success: "var(--stratis-success)"
}
```

## Shape And Density

- Radius should remain restrained, mostly `6px` to `8px`.
- Panels use thin borders and subtle shadows.
- Do not use decorative floating page sections.
- Do not nest cards unless the inner element is a repeated item, modal content, or genuinely framed sub-record.
- Strategy should use medium density with more space for reasoning.
- Healthcare should use higher density for scanning queues, blockers, and operational statuses.

## Shared Component Grammar

The following component roles define the STRATIS visual and behavioural contract. Repos may implement them locally, but their behaviour and visual grammar should remain consistent.

### Core Shell

- `StratisShell`: page background, header, navigation region, and main content width.
- `StratisHeader`: portfolio logo, STRATIS parent mark, product name, optional short descriptor.
- `StratisNav`: icon plus label navigation, teal active state, readable inactive state, no clipped borders or focus rings.
- `PageHeader`: page title, short context, optional page actions.

### Surfaces

- `WorkbenchPanel`: default panel primitive.
- `MetricCard`: KPI or summary number.
- `DecisionCard`: recommendation or decision surface with rationale and next action.
- `EvidenceCard`: strategy evidence, assumption, or source surface.
- `GovernanceEventCard`: healthcare governance event or recommendation rationale surface.

### Controls

- `PrimaryButton`: main action, teal background.
- `SecondaryButton`: border action.
- `DangerButton`: delete, reject, or destructive confirmation.
- `SegmentedControl`: binary or small option-set switching.
- `FilterPopover`: compact filter surface.
- `FilterChip`: active filter criterion with icon-only remove control.
- `InfoTooltip`: lowercase `i` icon with hover and click support.

### Data Display

- `DataTable`: dense table, uppercase headers, active sort icon only, responsive overflow.
- `StatusPill`: Good, Neutral, Warning, Critical, or local equivalents.
- `RiskPill`: Low, Medium, High, Critical.
- `ChartPanel`: standard chart title row, consistent margins, explicit dark-mode tick and tooltip contrast.

### Workflow

- `ReviewActionPanel`: human decision controls with required rationale for high-impact actions.
- `ExportModal`: format selector, filename input, cancel/export actions.
- `SettingsSidebar`: left settings categories, right settings content panel.

## Screen-Level Standards

### Global App Layout

- Compact deep ink header.
- Portfolio logo on the far left.
- `STRATIS` parent label visible with product name.
- No long descriptive sentence in the app header.
- Primary navigation directly below or inside the header.
- Main content max width approximately `max-w-7xl`.
- Main content padding: `16px` mobile, `24px` desktop.
- No marketing hero layouts inside the tool surface.

### Overview Pages

The overview must answer: what needs attention now?

Strategy overview should emphasise:

- project context;
- decision question;
- evidence readiness;
- top option;
- risk and sensitivity highlights;
- recent decision log.

Healthcare overview should emphasise:

- KPI cards;
- operating signal chart;
- decision loop;
- department load;
- readiness mix.

### Workbench Pages

Workbench pages should use dense panels, sortable/filterable tables, and clear action surfaces.

Strategy workbench pages include:

- evidence workspace;
- assumption ledger;
- option scoring matrix;
- sensitivity analysis;
- pre-mortem.

Healthcare workbench pages include:

- Command Centre;
- Escalation Queue;
- Human Review;
- KPI Tree.

### Review And Decision Pages

Shared structure:

- item queue or list;
- selected item panel;
- recommendation or rationale block;
- human action controls;
- required rationale for high-impact decisions;
- visible status or outcome after action.

### Governance And Decision Logs

- Provide filter controls.
- Show active filter chips.
- Display human-readable event cards.
- Preserve structured metadata.
- Do not show raw JSON on the frontend.
- Strategy may use `Decision Log`.
- Healthcare may use `Governance Log`.

### Brief And Export Pages

- Include relevant mode or duration controls.
- Provide text or Markdown display mode where relevant.
- Provide formatted brief view.
- Use a shared export modal pattern.
- Include report charts where useful.

### Settings Pages

Settings should use a left sidebar and right content panel.

Recommended category order:

1. Appearance
2. Data Controls
3. Governance / Decision Rules
4. Taxonomy / Model Settings
5. Guardrails

Guardrails should explain data, privacy, and scope boundaries.

## Responsive Standards

Mobile:

- Horizontal navigation scroll.
- Tables use horizontal overflow.
- Cards stack vertically.
- Modals fit viewport width and use internal scrolling.

Tablet:

- Use two-column dashboard panels where content allows.

Desktop:

- Dense dashboards use two- or three-column grids.
- Workbench tables and selected-detail panels may sit side by side.

## Product-Specific Mapping

### STRATIS Strategy & Insight Engine

Expression:

- executive reasoning workbench;
- medium density;
- stronger editorial hierarchy;
- more room for documents, evidence, assumptions, and rationale.

Primary surfaces:

- project workspace;
- document ingestion;
- evidence workspace;
- assumption ledger;
- option scoring;
- sensitivity analysis;
- pre-mortem;
- executive brief;
- decision log.

### STRATIS Healthcare Ops Command Centre

Expression:

- operational command centre;
- higher density;
- stronger queue, SLA, risk, and department signalling.

Primary surfaces:

- operating overview;
- Command Centre;
- Escalation Queue;
- Human Review;
- KPI Tree;
- Governance Log;
- Operating Brief;
- Settings.

## Implementation Rules

- Tokens are canonical.
- Avoid hardcoded colour literals in components.
- Domain vocabulary stays local.
- Header, navigation, panel, button, table, filter, modal, and settings grammar should match.
- Charts must use shared chart tokens.
- Dark-mode contrast must be explicitly checked.
- README screenshots should be updated after UI migration.
- Healthcare implementation should happen before Strategy implementation.

## Acceptance Criteria

The STRATIS brand system is implemented correctly when:

- both repos use the same STRATIS token values;
- both repos share the same header and navigation treatment;
- panels, buttons, forms, filters, modals, tables, and pills feel consistent;
- domain workflows remain distinct;
- both repos build successfully;
- both repos deploy successfully;
- README and docs reflect the STRATIS family.

## Migration Plan

1. Add this design spec to both repos.
2. Implement STRATIS tokens in Healthcare Ops.
3. Refactor Healthcare Ops shell, header, navigation, panels, controls, tables, charts, modals, and settings to use the shared grammar.
4. Verify Healthcare Ops across light mode, dark mode, desktop, tablet, and mobile.
5. Implement the same token and component grammar in Strategy & Insight Engine.
6. Verify Strategy across core project, evidence, scoring, brief, and settings workflows.
7. Update README screenshots and documentation in both repos.
