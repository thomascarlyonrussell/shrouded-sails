## Why

Shrouded Sails is currently deployment-coupled to Vercel, including production metadata, analytics wiring, and domain ownership. We need a controlled migration to Netlify with full registrar transfer so hosting and DNS are consolidated while preserving `shroudedsails.com` continuity.

## What Changes

- Add first-class Netlify deployment requirements for build, publish, SPA routing, preview, and rollback behavior.
- Add explicit domain migration requirements for full registrar transfer from Vercel and Netlify DNS cutover.
- Define migration sequencing and verification requirements to minimize downtime and preserve HTTPS.
- Replace Vercel-specific production assumptions in canonical/OG metadata and analytics integration.
- **BREAKING**: Production deployment source of truth moves from Vercel to Netlify.

## Capabilities

### New Capabilities
- `netlify-deployment`: Define required behavior for Netlify-based build, static publish, SPA fallback routing, preview deploys, and production promotion.
- `domain-registrar-migration`: Define required behavior for registrar transfer to Netlify, DNS zone setup, and cutover validation for `shroudedsails.com`.

### Modified Capabilities
- `vercel-deployment`: Change requirements from active production deployment to decommission/transition behavior and rollback window expectations.

## Impact

- Deployment configuration files and CI settings (Netlify config, redirect handling, environment variable mapping).
- Frontend metadata and analytics provider wiring in `client/index.html` and `client/src/main.js`.
- Domain operations: registrar transfer workflow, DNS records, SSL issuance, and propagation monitoring.
- Operational playbooks and release runbooks for cutover and rollback.