## 1. Atmosphere Configuration

- [x] 1.1 Add centralized atmosphere and fog visual tuning constants in `shared/constants.js` (opacity bands, drift speeds, smoothing values, cache resolution hints).
- [x] 1.2 Define renderer-facing defaults for calm/ethereal mood and ensure existing color constants remain backward-compatible.
- [x] 1.3 Add a renderer initialization path to read and store atmosphere config without altering gameplay state.

## 2. Renderer Layering and Wind-Coupled Atmosphere

- [x] 2.1 Refactor `Renderer` draw flow to insert atmospheric passes while preserving tactical draw order (ships, highlights, grid, combat effects).
- [x] 2.2 Implement static water atmosphere layer generation (depth/haze treatment) with offscreen caching.
- [x] 2.3 Implement dynamic mist layer animation with lightweight time-based offsets.
- [x] 2.4 Link mist drift direction and intensity to wind direction/strength from game state.
- [x] 2.5 Add smoothing/interpolation for visual wind transitions to avoid abrupt frame-to-frame direction snaps.
- [x] 2.6 Ensure atmospheric layers remain spatially coherent across zoom/pan and camera transitions.

## 3. Fog Density and Boundary Treatment

- [x] 3.1 Extend fog overlay rendering to support density bands (frontier, mid-unseen, deep-unseen) from visibility coverage.
- [x] 3.2 Implement softened/feathered visible-unseen boundary treatment while preserving tile readability.
- [x] 3.3 Preserve existing fog invariants (no fog on visible water, islands always visible, hidden enemy logic unaffected).
- [x] 3.4 Update fog caching/invalidation strategy so visibility recomputation happens on state changes, not on every animation frame.

## 4. Readability and Performance Validation

- [x] 4.1 Verify tactical readability in move/attack/board states (highlights, ship silhouettes, grid lines, ghost ships).
- [x] 4.2 Profile render performance on landscape and portrait board layouts and tune cache resolution/opacity as needed.
- [x] 4.3 Validate behavior across wind states (strength 0 and strength >0, direction changes at wind phase boundaries).
- [x] 4.4 Add or update focused logic tests for any extracted deterministic helpers (e.g., fog density classification) if introduced.
- [x] 4.5 Document visual tuning controls and fallback/rollback path in change notes.
