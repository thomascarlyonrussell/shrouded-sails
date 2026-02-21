## 1. Transfer Eligibility Gate

- [ ] 1.1 Confirm domain transfer lock window has expired and domain is eligible for transfer.
- [ ] 1.2 Record transfer preflight checklist (unlock status, auth code readiness, registrant contact confirmation).

## 2. Registrar Transfer Execution

- [ ] 2.1 Initiate registrar transfer for `shroudedsails.com` and track milestones to completion.
- [ ] 2.2 Resolve transfer errors/rejections and re-run initiation if required.

## 3. Netlify DNS Authority and Cutover

- [ ] 3.1 Configure Netlify DNS authoritative records for apex and `www` plus verification records.
- [ ] 3.2 Perform DNS cutover and verify `https://shroudedsails.com` TLS readiness.
- [ ] 3.3 Validate production candidate behavior (boot, assets, SPA fallback, bug report API) after cutover.

## 4. Post-Cutover Controls

- [ ] 4.1 Run post-cutover checks across multiple resolvers during rollback window.
- [ ] 4.2 Disable Vercel as production authority while preserving rollback-only access until window completes.
- [ ] 4.3 Remove legacy Vercel bindings and archive deployment settings after rollback window success.
