# Change log — PA Logic Baseline v1.1 Sandbox

## Changes in this working copy

10. Integrated the five validated HOR2 Key Activities (PA-06, PA-08, PA-05, PA-09, PA-07) with trigger points, proposed evidence, and explicit sandbox status; this does not represent actual operational completion.

1. Added an isolated HOR2 implementation simulation tab; it is not stored in D1 and does not mutate project monitoring records.
2. Added A-S1 sub-workfront evaluation separate from WF-A full scope.
3. Added scope-level MR/CMR/LTR gate display and explicit preconditions: readiness recheck, dependency verification, approval, and contingency review when LTR exceeds 1.25.
4. Added dynamic sequence candidate and a schedule table clearly labeled hypothetical until A-S1 is released.
5. Reproduced the controlled scenario output (4→0 waiting days; H13→H9; premature planned starts 1→0; contingency evaluation flag 0→1) with explicit assumptions and no claim of actual execution/savings.
6. Clarified operational logistics-panel wording: contingency `YES` is now displayed as `TRIGGERED — EVALUATION REQUIRED (not execution)`.
7. Updated new decision-log entries to preserve the same distinction.
8. Changed Wrangler config to a sandbox Worker name and placeholder D1 ID; deployment/create-db/secret commands are intentionally disabled.
9. Removed the stale OT v1.3 `dist` build. Run `npm run build` after dependency installation to generate the v1.1 frontend bundle.

## QA performed in this environment

- `lib/pa-simulation.ts`: strict TypeScript check passed.
- `app/pa-simulation.tsx`, `app/dashboard.tsx`, `lib/model.ts`: TypeScript transpile/syntax diagnostics passed.
- `tests/pa-simulation.mjs`: 23 assertions passed (including HOR2 Key Activities order/traceability).
- `tests/sandbox-safety.mjs`: 9 assertions passed.
- Standalone HTML preview JavaScript syntax check passed.

## QA not completed

- Full `npm install`, `npm run check`, `npm test`, and Vite production build could not be completed here because dependency installation timed out and the npm cache did not contain all packages.
- No full browser UAT has been completed by the user.
- No Cloudflare staging deployment has been created.
- No production Worker deployment or production D1 write was performed.
