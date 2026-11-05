# QA result — PA Logic Baseline v1.1 sandbox, integration pass 2

## Scope

Isolated HOR2 implementation simulation, integration of the five validated HOR2 Key Activities, A-S1 readiness/release conditions, sequencing, standalone preview behavior, and sandbox safety. This is code-level QA, not browser UAT or production acceptance.

## Passed

- `lib/pa-simulation.ts`: strict TypeScript compile — PASS.
- React/TypeScript source syntax transpilation for `app/pa-simulation.tsx`, `app/dashboard.tsx`, `app/main.tsx`, `lib/model.ts`, `lib/pa-simulation.ts`, `worker/index.ts`, and `worker/auth.ts` — PASS. This is a syntax/transpile check, not a full project typecheck.
- `tests/pa-simulation.mjs`: 23 assertions — PASS, including HOR2 Key Activities order and traceability.
- `tests/sandbox-safety.mjs`: 9 assertions — PASS; sandbox Worker/D1 identifiers remain isolated.
- `tests/auth.mjs`: 8 authentication/session checks — PASS.
- `tests/preview-smoke.mjs`: 12 assertions — PASS; default HOLD, conditional release, contingency review gate, and dynamic Key Activity statuses checked in a simulated DOM.
- HOR2 Key Activities table: five activities in validated ETD order PA-06, PA-08, PA-05, PA-09, PA-07 — PASS. Trigger points and proposed evidence are displayed; statuses explicitly avoid claiming operational execution.
- Standalone HTML preview JavaScript syntax and smoke behavior — PASS.
- Scenario oracle: baseline A→B→C = 4 waiting days / H13; candidate C→B→A-S1 = 0 waiting days / H9 under the declared assumptions — PASS.
- Safety guard: sandbox Wrangler configuration does not point to production D1 or Worker — PASS.

## Not yet verified

- Dependency installation: `npm install --no-audit --no-fund --ignore-scripts` timed out; no `node_modules` directory was produced.
- Full `npm run check`, complete `npm test`, and Vite production build — NOT RUN to completion because project dependencies are unavailable. Individual dependency-based tests that import `zod`, `react`, or the local `typescript` package cannot run until dependencies are installed.
- Interactive browser test of the full React application — NOT RUN.
- Cloudflare staging deployment — NOT CREATED.
- Production update — NOT PERFORMED.

## Interpretation guardrails

- WF-A full scope remains HOLD with baseline MR 60%, CMR 50%, LTR 1.43.
- WF-B is CONDITIONAL GO only for a verified scope (MR 85%, CMR 100%, LTR 1.17).
- WF-C is GO under the sample input (MR 100%, CMR 100%, LTR 1.00).
- A-S1 sample values (MR 85%, CMR 100%, LTR 1.00, ready H5, duration 5 days) are illustrative and editable, not operational facts.
- A-S1 release remains held until readiness recheck, dependency verification, and approval; if its LTR exceeds 1.25, contingency review is also required.
- The contingency evaluation flag is a manual scenario input, not evidence of actual contingency execution.
- H13→H9 is a hypothetical schedule result: one crew, durations A=5/B=1/C=3, no transit/setup time, and all preconditions met.
- The Key Activities evidence column contains proposed evidence/documentation, not records already created or proof of field execution.
