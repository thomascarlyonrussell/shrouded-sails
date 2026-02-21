## Why

The registrar/DNS cutover work is currently blocked because the domain is not yet eligible for transfer. We need to preserve these tasks in a dedicated follow-up change so they can be executed as soon as the transfer age window opens.

## What Changes

- Execute registrar transfer preflight and transfer initiation after eligibility date.
- Complete Netlify DNS authority setup and production cutover verification.
- Complete rollback-window monitoring and Vercel decommission steps.

## Capabilities

### New Capabilities
- `domain-transfer-cutover-execution`: Execute delayed registrar transfer, Netlify DNS authority cutover, and post-cutover operational controls.

### Modified Capabilities
- `domain-registrar-migration`: Continue and finalize previously specified registrar migration requirements once eligible.

## Impact

- Domain registrar operations and DNS ownership controls.
- Netlify production domain and TLS activation.
- Final Vercel decommission timeline.
