## Context

The current board rendering pipeline draws a flat water fill, island tiles, a binary fog overlay, tactical overlays, ships, and grid lines in a full-frame canvas loop. This is performant and readable, but visually flat. The project direction for this change is calm and ethereal, with atmosphere tied to gameplay state: wind should be visible in motion cues, and unseen zones should feel denser than near-frontier areas.

Constraints:
- Canvas immediate-mode rendering remains the core pattern (no framework or scene graph adoption).
- Tactical readability must remain primary (ship silhouettes, move/attack overlays, and grid legibility).
- Fog-of-war mechanics and combat/movement rules do not change.
- Existing turn cadence for gameplay wind remains authoritative.

Stakeholders:
- Players (theme immersion + tactical clarity)
- Gameplay maintainers (no hidden rules changes)
- Renderer maintainers (predictable performance envelope)

## Goals / Non-Goals

**Goals:**
- Introduce layered atmospheric visuals that make the board feel calm, misty, and oceanic.
- Couple atmosphere motion to wind direction/strength so visual cues reinforce game state.
- Increase visual density in deep unseen fog zones while softening visible/unseen transitions.
- Keep rendering stable across zoom/pan and performant on desktop/mobile.

**Non-Goals:**
- No changes to visibility logic, movement logic, combat resolution, or win conditions.
- No new gameplay weather mechanics (storms, damage, accuracy changes) in this change.
- No UI redesign of HUD/panels/settings beyond minimal controls needed for visual tuning.

## Decisions

### 1. Use layered atmospheric passes in the existing renderer pipeline
Decision:
- Add atmosphere as layered passes around existing terrain/fog rendering rather than replacing tile rendering.
- Keep gameplay overlays and ship rendering order intact to preserve clarity.

Rationale:
- Minimizes risk to interaction logic and keeps compatibility with existing camera and combat effects.
- Supports incremental tuning via opacity/speed constants.

Alternatives considered:
- Replace tile rendering with fully procedural ocean shader-like approach.
  - Rejected due to complexity and higher performance risk in Canvas 2D.

### 2. Drive mist drift from wind state, with visual smoothing
Decision:
- Sample wind direction/strength from game wind state and map to mist drift vector and opacity/speed.
- Apply easing when wind changes direction so visual motion remains calm/ethereal instead of snapping.

Rationale:
- Creates direct affordance between gameplay wind and atmosphere without altering mechanics.
- Smoothing avoids abrupt mood breaks at turn boundaries.

Alternatives considered:
- Independent random drift unrelated to wind.
  - Rejected because it weakens thematic/gameplay coupling.

### 3. Introduce fog density bands based on visibility frontier distance
Decision:
- Keep visibility computation authoritative from fog-of-war coverage.
- Render unseen water with density tiers: frontier band (lighter), mid unseen (medium), deep unseen (densest).
- Use feathered edge treatment between visible and unseen zones.

Rationale:
- Preserves tactical readability near engagement boundaries while increasing atmosphere depth in unknown space.

Alternatives considered:
- Uniform fog alpha for all unseen tiles.
  - Rejected because it keeps the board visually flat and less informative.

### 4. Separate static and dynamic atmospheric caches
Decision:
- Cache static layers (base water depth treatment) independent of turn updates.
- Cache visibility-derived fog masks keyed by visibility state.
- Render dynamic mist animation with lightweight time offset and optional reduced-resolution buffer.

Rationale:
- Maintains frame pacing in full redraw loop while enabling subtle motion.

Alternatives considered:
- Recompute all fog and atmosphere per frame at full resolution.
  - Rejected due to avoidable CPU cost and mobile risk.

### 5. Centralize tunables in shared constants
Decision:
- Add atmosphere/fog visual tuning constants in shared configuration to avoid hardcoded magic numbers.

Rationale:
- Aligns with existing project conventions and simplifies balancing/tuning passes.

Alternatives considered:
- Hardcode values directly inside renderer methods.
  - Rejected for maintainability and consistency reasons.

## Risks / Trade-offs

- [Risk] Overly dense fog can reduce tactical readability near active ships/highlights. -> Mitigation: enforce maximum opacity ceilings near frontier and maintain highlight contrast checks.
- [Risk] Wind-coupled motion could feel noisy if direction shifts are abrupt. -> Mitigation: blend toward new vectors over fixed easing windows.
- [Risk] Additional passes may reduce FPS on low-end devices. -> Mitigation: use offscreen caching and optional reduced-resolution mist buffer.
- [Risk] Layer ordering mistakes may obscure grid or ships. -> Mitigation: keep overlays/ships in existing order and add visual regression checks for key states.

## Migration Plan

1. Add atmospheric/fog tuning constants and defaults with conservative opacity/speed values.
2. Implement layered renderer passes behind a visual feature toggle defaulted on for this change branch.
3. Validate readability in representative game states (idle board, move mode, attack mode, ghost ships, zoomed view).
4. Validate performance budget on desktop and mobile viewport sizes.
5. If regressions appear, rollback by disabling new atmosphere passes and keeping existing fog mask behavior.

Rollback strategy:
- Revert to current single-layer fog overlay and flat water fill by disabling new rendering passes.
- No data migration is required.

## Open Questions

- Should atmosphere intensity be configurable in settings (Off/Low/Default), or fixed for now?
- Should wind calm state (strength 0) still animate minimal ambient drift, or become almost static?
- Should deep-unseen density be equal for both players or adapt to board size/layout?
