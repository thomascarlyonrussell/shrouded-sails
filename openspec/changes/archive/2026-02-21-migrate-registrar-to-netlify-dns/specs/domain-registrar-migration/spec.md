## ADDED Requirements

### Requirement: Registrar transfer preflight and initiation
The system SHALL define a registrar-transfer preflight for `shroudedsails.com` before initiating transfer from Vercel.

#### Scenario: Preflight confirms transfer readiness
- **WHEN** migration operators begin transfer preparation
- **THEN** preflight verifies domain unlock state, authorization requirements, and registrant contact readiness
- **AND** transfer initiation is blocked until preflight passes

#### Scenario: Transfer is initiated with tracking
- **WHEN** preflight passes
- **THEN** operators initiate registrar transfer and record transfer status checkpoints
- **AND** unresolved transfer errors trigger rollback to prior production routing plan

### Requirement: Netlify DNS zone authority
The system SHALL configure Netlify DNS as authoritative for `shroudedsails.com` with required production records.

#### Scenario: Authoritative DNS records are present
- **WHEN** Netlify DNS is activated for the domain
- **THEN** apex and `www` records route to Netlify-hosted production
- **AND** required verification records for TLS/domain ownership are configured

### Requirement: DNS cutover validation
The system SHALL verify DNS propagation and HTTPS readiness after nameserver or zone cutover.

#### Scenario: DNS and TLS are validated post-cutover
- **WHEN** authoritative DNS is switched to Netlify
- **THEN** validation confirms `shroudedsails.com` resolves to Netlify endpoints
- **AND** certificate status is valid before declaring migration complete

#### Scenario: Partial propagation is handled safely
- **WHEN** DNS propagation is inconsistent across resolvers
- **THEN** migration runbook keeps Vercel rollback path intact until consistency thresholds are met
- **AND** user-facing communications avoid declaring cutover complete prematurely

### Requirement: Rollback and decommission controls
The system SHALL define explicit rollback and decommission controls for registrar/DNS migration.

#### Scenario: Rollback is executed within window
- **WHEN** post-cutover critical checks fail during rollback window
- **THEN** operators restore prior known-good routing and DNS strategy
- **AND** incident notes capture failure cause and next cutover attempt criteria

#### Scenario: Legacy platform is decommissioned safely
- **WHEN** rollback window ends with stable Netlify production
- **THEN** Vercel domain bindings and deployment routing are decommissioned
- **AND** documentation is updated to reflect Netlify as the only production authority