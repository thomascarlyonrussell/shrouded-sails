## Context

Shrouded Sails currently deploys static assets from `client/dist` via Vercel using root-level `vercel.json` routing. The production frontend still contains Vercel-specific canonical/OG URLs and production analytics wiring. The application also submits bug reports to `/api/submit-issue`, which currently assumes an API route available in the deployment platform. The migration scope is to move hosting to Netlify and complete full registrar transfer of `shroudedsails.com` from Vercel, with Netlify DNS as the authoritative zone.

Constraints:
- Minimize production downtime and SEO/social regressions.
- Preserve SPA fallback behavior (`/(.*) -> /index.html`).
- Preserve domain availability and TLS during DNS/registrar cutover windows.
- Keep a bounded rollback window while Vercel remains intact until Netlify production is verified.

Stakeholders:
- Maintainers operating deployment and domain settings
- End users accessing `shroudedsails.com`

## Goals / Non-Goals

**Goals:**
- Define a deterministic Netlify deployment contract equivalent to current Vite static hosting behavior.
- Define a safe registrar transfer + DNS authority migration path to Netlify DNS.
- Define migration sequencing, verification, and rollback gates before Vercel decommission.
- Identify required platform-coupled application changes (metadata URLs, analytics provider, API integration expectations).

**Non-Goals:**
- Building multiplayer backend infrastructure.
- Reworking game mechanics or UI behavior unrelated to hosting/domain migration.
- Implementing a new bug-report backend provider beyond required compatibility decisions.

## Decisions

### 1. Netlify becomes production deployment authority
- Decision: Netlify will own build/deploy lifecycle for production and preview deployments.
- Rationale: Consolidates hosting with target DNS provider and reduces split-platform operations.
- Alternative considered: Keep Vercel for deploy while only moving DNS. Rejected because it does not achieve requested full platform migration.

### 2. Full registrar transfer is explicit scope, not optional follow-up
- Decision: `shroudedsails.com` registrar ownership migrates away from Vercel to Netlify-supported registrar flow, with Netlify DNS authoritative after completion.
- Rationale: Matches requested operating model and removes long-term dependency on Vercel domain controls.
- Alternative considered: Keep registrar at Vercel and only delegate nameservers. Rejected for this change because user requested full transfer.

### 3. Two-phase cutover with rollback window
- Decision: Phase A deploy parity on Netlify and verify with temporary Netlify domain; Phase B execute domain/DNS cutover and keep Vercel deployment available during propagation/validation window.
- Rationale: Separates application risk from DNS/registrar risk and allows faster rollback.
- Alternative considered: Big-bang same-day switch of hosting and registrar. Rejected due to compounded outage risk.

### 4. Platform-coupled frontend metadata and analytics are migrated
- Decision: Remove/replace Vercel-coupled production metadata and analytics integration so canonical/OG/image URLs resolve on the new primary domain and telemetry is provider-appropriate.
- Rationale: Avoid stale origin references and broken preview snippets after migration.
- Alternative considered: Keep existing references temporarily. Rejected because it causes SEO/social inconsistency.

### 5. `/api/submit-issue` compatibility is a release gate
- Decision: Migration completion requires a defined behavior for `/api/submit-issue` on Netlify (function parity or intentional degradation with user-facing handling).
- Rationale: Current UX depends on this endpoint for issue reporting.
- Alternative considered: Ignore endpoint until later. Rejected because it creates silent production breakage.

## Risks / Trade-offs

- [Registrar transfer delay or rejection] -> Mitigation: Preflight unlock/authorization/contact verification and schedule within low-traffic window.
- [DNS propagation inconsistency] -> Mitigation: Lower TTL ahead of cutover, maintain dual-platform readiness during propagation.
- [TLS issuance lag on new authority] -> Mitigation: Validate certificate readiness on Netlify before declaring migration complete.
- [Broken SPA deep links] -> Mitigation: Enforce and test Netlify rewrite fallback for all non-asset routes.
- [Bug report API regression] -> Mitigation: Add explicit test case for `/api/submit-issue` in verification checklist and block production cutover if unresolved.

## Migration Plan

1. Prepare Netlify project build settings (`npm run build:client`, publish `client/dist`) and SPA fallback configuration.
2. Deploy from main branch to Netlify and validate parity on Netlify subdomain.
3. Migrate platform-coupled app references (domain metadata/analytics assumptions) and verify on preview/production candidate.
4. Finalize `/api/submit-issue` path behavior in Netlify environment.
5. Run registrar transfer preflight, initiate transfer, and configure Netlify DNS zone records.
6. Point authoritative DNS to Netlify, validate apex + `www`, TLS, and critical user flows.
7. Hold rollback window with Vercel deployment intact until post-cutover checks pass for agreed duration.
8. Decommission Vercel production routing/domain bindings after acceptance.

Rollback:
- If Netlify app behavior fails before DNS cutover, keep Vercel as production and iterate.
- If post-cutover issues occur during rollback window, restore previous DNS authority/records and set Vercel as active production endpoint.

## Open Questions

- Should bug reports remain same-origin (`/api/submit-issue`) via Netlify Function, or move to dedicated external endpoint?
- What rollback window duration is acceptable (for example 24h vs 72h) before Vercel decommission?
- Do we require preserving the `shrouded-sails.vercel.app` URL as a non-primary legacy endpoint after migration?