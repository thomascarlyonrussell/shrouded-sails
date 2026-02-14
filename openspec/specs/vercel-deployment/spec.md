# Vercel Deployment Specification

## Purpose

Vercel deployment configuration for static frontend hosting, serverless backend functions, automatic deployment on Git push, and routing rules for API and client requests.

## Requirements

### Requirement: Vercel configuration file

The system SHALL provide a `vercel.json` configuration file at repository root that defines build commands, output directories, routing rules, and serverless function settings.

#### Scenario: Configuration file exists
- **WHEN** repository is checked out
- **THEN** `vercel.json` exists at root directory
- **AND** file contains valid JSON
- **AND** file includes build command, output directory, routes, and functions configuration

### Requirement: Frontend static hosting

The system SHALL configure Vercel to serve the client application as a static site from the `client/dist/` directory after building with Vite.

#### Scenario: Frontend build is configured
- **WHEN** Vercel deployment runs
- **THEN** Vercel executes build command: `npm run build:client`
- **AND** Vercel reads static files from `client/dist/` directory
- **AND** Vercel serves files with appropriate cache headers

#### Scenario: Frontend is accessible at root URL
- **WHEN** user visits deployed site root URL (e.g., `https://shrouded-sails.vercel.app/`)
- **THEN** Vercel serves `client/dist/index.html`
- **AND** game loads successfully
- **AND** all assets (JS, CSS, sounds) load correctly

### Requirement: Backend serverless functions

The system SHALL configure Vercel to deploy the Bun backend as serverless functions accessible under `/api/*` routes.

#### Scenario: Backend is deployed as serverless function
- **WHEN** Vercel deployment runs
- **THEN** Vercel deploys `server/index.ts` as serverless function
- **AND** function uses Bun runtime (specified in `vercel.json`)

#### Scenario: API routes are accessible
- **WHEN** user sends request to `https://shrouded-sails.vercel.app/api/health`
- **THEN** Vercel routes request to serverless function
- **AND** function returns HTTP 200 with health check JSON
- **AND** response time is acceptable (<2 seconds including cold start)

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

The system SHALL automatically trigger Vercel deployment when code is pushed to the main branch of the connected GitHub repository.

#### Scenario: Main branch triggers production deployment
- **WHEN** code is pushed to main branch
- **THEN** Vercel automatically starts deployment
- **AND** Vercel builds client application
- **AND** Vercel deploys serverless functions
- **AND** Vercel assigns production URL
- **AND** previous production deployment remains accessible until new deployment succeeds

#### Scenario: Feature branches trigger preview deployments
- **WHEN** code is pushed to non-main branch
- **THEN** Vercel creates preview deployment with unique URL
- **AND** preview deployment does not affect production
- **AND** preview URL is commented on associated pull request (if GitHub integration enabled)

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
