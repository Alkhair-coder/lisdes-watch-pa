# LISDES Watch — PA Logic Baseline v1.1 Sandbox

## Status
This is a separate working copy derived from LISDES Watch OT v1.3. It is not deployed. The production Worker `lisdes-watch` and production D1 database are not targeted by this package.

## What changed in this sandbox
- The existing operational pages remain in place.
- The `Simulasi HOR2 v1.1` tab now has an isolated client-side scenario for WF-A full scope, WF-B, WF-C, and A-S1.
- The tab includes the five HOR2 Key Activities in validated ETD order (PA-06, PA-08, PA-05, PA-09, PA-07), with triggers, proposed evidence, and sandbox-only status labels.
- A-S1 is evaluated separately from WF-A full scope. MR/CMR recheck, dependency verification, approval, and contingency review (when triggered) are represented explicitly.
- The scenario metrics are marked hypothetical and not saved to D1.
- Contingency trigger wording distinguishes evaluation from actual execution.
- New tests cover readiness gate, A-S1 release logic, sequencing, the baseline scenario, and HOR2 Key Activities order/traceability.

## Safety boundary
- `wrangler.json` uses a sandbox Worker name and a placeholder D1 ID.
- `npm run deploy`, `npm run create-db`, and `npm run secret` are intentionally disabled in this copy.
- `npm run migrate` is local-only.
- Do not replace the placeholder D1 ID with the production database ID.
- The exact production rollback point remains Cloudflare deployment history; this local source is not a byte-for-byte compiled Worker export.

## Local trial and error
Requires Node.js 22.18+ and internet access for dependencies. The current code-level QA pass does not replace the full dependency-backed build or browser UAT.

```bash
npm install
npm run check
npm run test:pa-v11
npm test
npm run build
npm run dev
```

Wrangler local development uses local D1 storage. Data in the PA Logic v1.1 simulation is browser-memory-only and resets on refresh. It is separate from saved operational project records.

## Test scenario default
- WF-A full scope: MR 60%, CMR 50%, LTR 1.43 → HOLD.
- WF-B: MR 85%, CMR 100%, LTR 1.17 → CONDITIONAL GO for verified scope.
- WF-C: MR 100%, CMR 100%, LTR 1.00 → GO.
- A-S1 initial sample: MR 85%, CMR 100%, LTR 1.00, material ready H5, duration 5 days. These A-S1 values are illustrative input values, not validated operational data.
- The schedule comparison reproduces 4→0 crew waiting days and H13→H9 only as a conditional scenario: one crew, durations A=5/B=1/C=3, no transit/setup delay, and all required preconditions met.
- Contingency evaluation flag 0→1 is a scenario flag, not proof of an alternative shipment being executed.

## Versioning
Working branch: `PA Logic Baseline v1.1 — Sandbox`. Keep this folder and its ZIP separate from the original OT v1.3 backup. Production finalization must be a separate, reviewed step after browser trial and error.
