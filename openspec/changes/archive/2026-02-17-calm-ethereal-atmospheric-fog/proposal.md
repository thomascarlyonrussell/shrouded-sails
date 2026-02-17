## Why

The battlefield currently reads as visually flat: water is a single-tone fill and fog uses a hard tile mask, which undercuts the game's fog-shrouded naval fantasy. This change adds calm, ethereal atmospheric depth and ties it directly to wind and visibility state so the board mood reinforces gameplay information.

## What Changes

- Add layered atmospheric rendering on the main board (water depth treatment, soft drifting mist, subtle ambient haze) with a calm, ethereal visual direction.
- Link atmospheric motion to the game wind system so mist drift direction/speed reflect current wind direction and strength.
- Increase fog density in unseen zones and soften transitions near visibility boundaries while preserving tactical readability.
- Ensure atmospheric/fog visuals remain performant in the existing full-frame canvas loop and stable across zoom/pan states.

## Capabilities

### New Capabilities
- `atmospheric-board-rendering`: Adds non-intrusive atmospheric layers (calm seascape depth and wind-driven mist cues) to the main battlefield render pipeline.

### Modified Capabilities
- `fog-overlay-rendering`: Update fog styling requirements to support denser deep-unseen zones and softer boundary transitions between seen and unseen water tiles.

## Impact

- Affected systems: `client/src/ui/Renderer.js`, `client/src/core/TurnManager.js` (wind timing context), `client/src/map/Wind.js`, `shared/constants.js` (visual tuning constants).
- Affected behavior: visual presentation only (no rules change to movement/combat/fog visibility logic).
- Performance considerations: additional canvas passes/caching strategy required to maintain smooth frame pacing on desktop and mobile.
