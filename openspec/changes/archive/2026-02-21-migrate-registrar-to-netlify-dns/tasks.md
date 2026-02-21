## 1. Netlify Deployment Baseline

- [x] 1.1 Add Netlify site configuration for `npm run build:client` with publish directory `client/dist`.
- [x] 1.2 Add SPA fallback routing for non-asset paths (`/* -> /index.html`) in Netlify config.
- [x] 1.3 Connect repository and verify preview deploys are created for non-main branches.

## 2. Application Decoupling from Vercel

- [x] 2.1 Replace Vercel canonical/OG/Twitter URL metadata in `client/index.html` with production-domain-safe values.
- [x] 2.2 Remove or replace `@vercel/analytics` usage in `client/src/main.js` and dependency declarations.
- [x] 2.3 Confirm production build output contains no hardcoded `shrouded-sails.vercel.app` references.

## 3. API Compatibility for Bug Reports

- [x] 3.1 Decide and document target hosting model for `/api/submit-issue` on Netlify (function parity or external endpoint).
- [x] 3.2 Implement and wire the chosen `/api/submit-issue` behavior for Netlify production.
- [x] 3.3 Validate successful and failure responses from bug report submission flow in deployed preview.

## 4. Registrar Transfer and Netlify DNS Setup

- [x] 4.1 Deferred to `complete-registrar-transfer-after-age-window` due registrar/domain age window constraints.
- [x] 4.2 Deferred to `complete-registrar-transfer-after-age-window` due registrar/domain age window constraints.
- [x] 4.3 Deferred to `complete-registrar-transfer-after-age-window` due registrar/domain age window constraints.

## 5. Cutover Verification and Rollback Controls

- [x] 5.1 Deferred to `complete-registrar-transfer-after-age-window` pending completion of transfer and DNS authority migration.
- [x] 5.2 Deferred to `complete-registrar-transfer-after-age-window` pending completion of transfer and DNS authority migration.
- [x] 5.3 Deferred to `complete-registrar-transfer-after-age-window` pending completion of transfer and DNS authority migration.

## 6. Vercel Decommission and Documentation

- [x] 6.1 Deferred to `complete-registrar-transfer-after-age-window` until rollback window can be started.
- [x] 6.2 Deferred to `complete-registrar-transfer-after-age-window` until rollback window can be completed.
- [x] 6.3 Update OpenSpec and project deployment documentation to reflect Netlify-only production ownership.
