# Vercel Deployment Specification

## Purpose

Vercel deployment configuration for static frontend hosting, serverless backend functions, automatic deployment on Git push, and routing rules for API and client requests.
## Requirements
### Requirement: Vercel configuration file
The system SHALL retain a `vercel.json` configuration file only for transition and rollback support during the migration window, and SHALL remove active production authority from Vercel once migration is accepted.

#### Scenario: Transition configuration remains available
- **WHEN** migration is in progress and rollback window is active
- **THEN** `vercel.json` remains present and valid for controlled fallback deployment
- **AND** Vercel production traffic remains secondary to Netlify production

#### Scenario: Transition configuration is decommissioned
- **WHEN** migration acceptance criteria and rollback window are complete
- **THEN** Vercel production authority is disabled
- **AND** any remaining Vercel configuration is documented as legacy-only or removed

### Requirement: Frontend static hosting
The system SHALL treat Vercel-hosted frontend delivery as temporary fallback-only behavior after Netlify production cutover.

#### Scenario: Netlify is primary after cutover
- **WHEN** `shroudedsails.com` resolves to Netlify production
- **THEN** Vercel-hosted frontend is not the canonical production endpoint
- **AND** canonical/metadata references do not point to `shrouded-sails.vercel.app`

#### Scenario: Fallback hosting is available during rollback window
- **WHEN** a critical post-cutover issue is detected
- **THEN** Vercel static hosting can be used as rollback target within the defined window
- **AND** fallback activation follows documented runbook steps

### Requirement: Routing rules

The system SHALL configure routing to map `/api/*` requests to backend serverless functions and all other requests to the frontend static site, with fallback to `index.html` for client-side routing.

#### Scenario: API requests route to backend
- **WHEN** request is made to any path starting with `/api/`
- **THEN** Vercel routes to serverless function in `server/`
- **AND** frontend is not involved

#### Scenario: Frontend requests route to static files
- **WHEN** request is made to root or any non-API path
- **THEN** Vercel attempts to serve static file from `client/dist/`
- **AND** if file exists, serves it directly
- **AND** if file does not exist, serves `index.html` (SPA fallback)

### Requirement: Automatic deployment on Git push
The system SHALL stop using Vercel automatic deployment as the production release path after migration completion.

#### Scenario: Migration window uses controlled fallback deploys
- **WHEN** Netlify is primary and rollback window is active
- **THEN** Vercel auto-deploys do not automatically become production
- **AND** fallback deploy usage requires explicit operator action

#### Scenario: Production release path is Netlify only
- **WHEN** migration is declared complete
- **THEN** production deployments are triggered and promoted through Netlify workflows
- **AND** Vercel deployment triggers are disabled or archived

### Requirement: Deployment status visibility

The system SHALL provide clear feedback on deployment status including logs, errors, and deployment URLs.

#### Scenario: Deployment succeeds
- **WHEN** Vercel deployment completes successfully
- **THEN** Vercel logs show all build steps passed
- **AND** deployment URL is displayed
- **AND** GitHub commit status (if connected) shows green check

#### Scenario: Deployment fails
- **WHEN** Vercel deployment encounters error (e.g., build failure)
- **THEN** Vercel logs show error message and stack trace
- **AND** deployment is marked as failed
- **AND** production site remains on previous working deployment
- **AND** GitHub commit status (if connected) shows red X

### Requirement: Environment variables support

The system SHALL support environment variables for sensitive configuration (e.g., future API keys, database URLs) configured via Vercel dashboard or CLI.

#### Scenario: Environment variables are accessible in serverless functions
- **WHEN** environment variable is set in Vercel project settings
- **THEN** serverless function can access variable via `process.env.VARIABLE_NAME`
- **AND** variable is not exposed to client-side code

#### Scenario: Build-time environment variables work
- **WHEN** environment variable is needed during Vite build (prefixed with `VITE_`)
- **THEN** Vite includes variable in client bundle
- **AND** variable is accessible via `import.meta.env.VITE_VARIABLE_NAME`

