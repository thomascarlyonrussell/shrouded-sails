## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Backend serverless functions
**Reason**: Vercel is no longer the production platform and backend function hosting is no longer required in the Vercel deployment capability contract.
**Migration**: Provide `/api/*` behavior through Netlify-compatible functions or an external API platform as defined in migration specs.
