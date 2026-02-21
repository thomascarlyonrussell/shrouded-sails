## ADDED Requirements

### Requirement: Netlify build and publish configuration
The system SHALL configure Netlify production and preview deployments to build the client workspace using `npm run build:client` and publish static assets from `client/dist`.

#### Scenario: Production build succeeds on Netlify
- **WHEN** Netlify deploys the default production branch
- **THEN** Netlify runs `npm install` and `npm run build:client`
- **AND** Netlify publishes files from `client/dist`

#### Scenario: Preview build succeeds on Netlify
- **WHEN** Netlify deploys a non-production branch or pull request
- **THEN** Netlify runs the same build command and publish directory settings
- **AND** a unique preview URL is available for validation

### Requirement: Netlify SPA routing fallback
The system SHALL provide SPA fallback routing on Netlify so unknown non-asset paths resolve to `index.html`.

#### Scenario: Deep link resolves via fallback
- **WHEN** a user requests a route that does not map to a static file
- **THEN** Netlify rewrites the request to `/index.html`
- **AND** the application loads without HTTP 404

### Requirement: Netlify production domain binding
The system SHALL bind `shroudedsails.com` as the primary custom domain on Netlify after DNS authority is migrated.

#### Scenario: Primary domain is active on Netlify
- **WHEN** DNS cutover and certificate issuance complete
- **THEN** Netlify serves production at `https://shroudedsails.com`
- **AND** HTTP requests redirect to HTTPS
- **AND** the Netlify subdomain remains available for operational checks

### Requirement: Release verification gates for migration
The system SHALL require migration verification checks before production cutover and before Vercel decommission.

#### Scenario: Pre-cutover verification passes
- **WHEN** deployment is validated on Netlify preview/temporary domain
- **THEN** verification confirms game boot, asset loading, SPA routing, and bug report submission behavior
- **AND** cutover is blocked if any required check fails

#### Scenario: Post-cutover verification passes
- **WHEN** `shroudedsails.com` points to Netlify
- **THEN** verification confirms DNS resolution, TLS validity, and core gameplay access
- **AND** Vercel decommission is blocked until checks pass for the agreed rollback window