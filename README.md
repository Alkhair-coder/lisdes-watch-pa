# LISDES Watch — PA Logic Baseline v1.1

A sandbox working copy for the Early Warning Dashboard and HOR2 mitigation-implementation simulation for the Papua Pegunungan distribution-network project.

> **Status: sandbox / non-production.** This repository is not connected to the production Worker or production D1 database. Simulation results are illustrative test outputs, not operational project data or evidence of completed field activities.

## Scope

- Existing dashboard interface and project-monitoring logic.
- HOR2 implementation simulation with the validated Key Activities order: PA-06, PA-08, PA-05, PA-09, PA-07.
- A-S1 sub-workfront readiness and release-gate evaluation, kept separate from WF-A full scope.
- Hypothetical sequencing and scenario outputs, with explicit assumptions and contingency-review wording.
- Worker authentication and API logic for isolated testing.

## Requirements

- Node.js 22.18.0 or newer.
- npm.

## Local verification

From the repository root:

```bash
npm install
npm run check
npm test
npm run build
```

To run the local Worker and dashboard:

```bash
npm run dev
```

For local authentication, create a local `.dev.vars` file containing a unique `ADMIN_KEY` value of at least 32 characters. Do not reuse a production secret and do not commit this file.

## Safety boundaries

- Do not deploy this package to the production Worker `lisdes-watch`.
- Do not replace the placeholder D1 identifier in `wrangler.json` with a production database identifier.
- Deployment, database-creation, and secret-setting scripts are intentionally disabled in this sandbox package.
- The PA simulation tab is isolated from project-monitoring records; its A-S1 scenario inputs remain in browser memory.
- A contingency flag means evaluation is required or represented in a scenario; it does not mean an alternative transport method was executed.
- A release-eligible simulation result is not authorization for real field execution.

Read [MULAI_DI_SINI.md](MULAI_DI_SINI.md), [SANDBOX_README.md](SANDBOX_README.md), and [INTEGRATION_TRIAL_GUIDE.md](INTEGRATION_TRIAL_GUIDE.md) for the detailed working instructions and scenario limitations.
