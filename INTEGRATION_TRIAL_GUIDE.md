# Integration trial guide — LISDES Watch PA Logic v1.1

## Purpose

This is a local sandbox working copy. The HOR2 Key Activities table is integrated into the PA simulation tab and the standalone preview. It is not deployed and does not write simulation results to the operational D1 database.

## Before running

- Use Node.js 22.18 or newer.
- Install dependencies from this folder with `npm install`.
- Create a local `.dev.vars` only if local Worker authentication requires it; start from `.dev.vars.example`, use a unique random local value, and never reuse a production secret.
- Keep the placeholder D1 ID in `wrangler.json`. Do not substitute production identifiers.

## Recommended verification

```bash
npm run check
npm run test:pa-v11
npm test
npm run build
npm run dev
```

Open the PA simulation tab and verify:

1. HOR2 Key Activities appear in this order: PA-06, PA-08, PA-05, PA-09, PA-07.
2. Trigger points and proposed evidence are visible. Proposed evidence is not represented as completed operational work.
3. WF-A full scope remains HOLD at MR 60%, CMR 50%, LTR 1.43.
4. A-S1 starts at HOLD — RECHECK REQUIRED. Completing recheck, dependency verification, and approval only makes it release-eligible under the sample conditions; it does not authorize real field execution.
5. LTR >1.25 triggers contingency review (provisional threshold); review is not proof of alternative transport execution.
6. Candidate sequencing and H13→H9 outputs remain hypothetical, with the stated one-crew, duration, and no-transit/setup-delay assumptions.
7. Exported data is labeled simulation, not operational data.

## Deployment boundary

No staging deployment is included in this package. Deployment scripts remain disabled. Production Worker and D1 are out of scope. Any future staging or production change requires separate review, isolated resources, and explicit approval.
