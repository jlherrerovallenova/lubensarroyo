# Project memory

## Product intent & audience

- Project `lubensarroyo` — likely a personal/professional site or dashboard for someone named Luben Sarroyo.
- Integrates Idealista statistical data (Spanish real estate platform) via CSV files, suggesting real-estate analytics or listings context.
- Content is in Spanish; audience is Spanish-speaking users.

## Brand personality & voice

- Spanish-language interface and content; maintain Spanish in user-facing text and communication.

## Visual design & UX direction

- Vite + React SPA.
- No specific design tokens, component library, or layout patterns inferred yet.

## Decisions, constraints & rationale

- GitHub repo: `jlherrerovallenova/lubensarroyo`, branch `main`.
- Git is blocked in this environment; repo sync done via ZIP download with `curl` and local file comparison.
- Local project and GitHub `main` were nearly identical; only a CSV statistics file (with Spanish-character encoding issues in filename) needed copying.
- Build compiles without errors after sync.

## Open questions & assumptions

- Exact role of Idealista CSV data in the app (display, analytics, import flow?) is not yet confirmed.
- No `.bolt/prompt` provided; no explicit global instructions or user constraints documented.
- Design system, styling approach, and deployment target not yet inferred.