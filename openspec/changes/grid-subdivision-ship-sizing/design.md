## Context

The naval combat game uses a 20×15 grid with 60px tiles rendered on an HTML5 Canvas (1200×900px). All ships — Sloops, Frigates, and Flagships — occupy a single grid tile regardless of their size class, limiting visual distinction and tactical positioning depth. The game board has a fixed landscape aspect ratio that wastes screen space on portrait-oriented mobile devices, and the canvas has no camera system (only a screen shake transform exists).

**Current State:**
- Single-tile ships with no footprint differentiation
- 20×15 grid at 60px per tile, fixed 1200×900 canvas
- No zoom, pan, or camera transform — `Renderer.render()` only applies shake offset via `ctx.translate()`
- `InputHandler` scales click coordinates for CSS responsiveness but has no camera awareness
- Fog of war fully implemented with per-tile vision, ghost ships at single-tile positions
- Fleet starting zones placed left (Player 1) and right (Player 2), relative to grid dimensions
- All gameplay constants (movement, range, vision, map generation) defined in `shared/constants.js`

**Constraints:**
- All gameplay values must scale uniformly to preserve existing balance
- Fog of war system is live and must remain compatible
- Game is currently single-device; architecture must not preclude future multiplayer
- Touch interaction on mobile must remain usable at higher grid resolutions
- Canvas rendering approach (2D context, full redraw per frame) must be preserved

## Goals / Non-Goals

**Goals:**
- Introduce variable ship footprints (1×1 Sloop, 2×1 Frigate, 2×2 Flagship)
- Subdivide the grid to support multi-tile positioning with meaningful granularity
- Support both landscape and portrait board layouts as a game setting
- Add pinch-to-zoom and pan for mobile touch interaction
- Scale all tile-based gameplay values uniformly with the subdivision ratio
- Maintain fog of war compatibility with multi-tile ships (center-based vision, full-footprint ghosts)
- Implement nearest-tile adjacency for boarding between multi-tile ships

**Non-Goals:**
- Multiplayer networking or remote game state synchronization
- AI pathfinding adaptations for multi-tile ships
- Animated ship rotation transitions (orientation changes are instant)
- Partial fog reveal at subdivision cell boundaries (fog operates at coarse-tile equivalents)
- Mouse-wheel zoom for desktop (touch-only zoom/pan for now)
- Resizable grid during gameplay (grid dimensions fixed at game creation)

## Decisions

### Decision 1: Subdivision ratio = 2×
**Choice:** Subdivide each current tile into a 2×2 block, doubling grid dimensions from 20×15 to 40×30 and halving tile size from 60px to 30px. Canvas remains 1200×900px for landscape.

**Rationale:**
- Smallest integer ratio that supports a 2×1 Frigate with meaningful positioning distinction from a 1×1 Sloop
- 40×30 = 1,200 tiles is manageable for per-frame fog overlay rendering and BFS pathfinding
- Clean doubling makes value scaling trivial (multiply by 2)
- 30px tiles are still visually readable on desktop at default zoom

**Alternative considered:** 3× subdivision (60×45 grid, 20px tiles)
- Rejected: 2,700 tiles strains fog rendering, BFS pathfinding becomes slower, 20px tiles are too small to read on desktop, and 3× ratio doesn't improve tactical depth proportionally over 2×

### Decision 2: Pre-scaled constants (not coarse × ratio at runtime)
**Choice:** Store all gameplay constants in `shared/constants.js` as their final fine-grid values. Include `SUBDIVISION_RATIO = 2` as a named constant for documentation, but do not multiply at runtime.

**Rationale:**
- Single source of truth — no ambiguity about whether a value is coarse or fine
- Zero runtime overhead — no multiplication at point of use
- Easier to debug — values in constants match values observed in gameplay
- Current codebase already reads constants directly; no call sites need wrapping

**Alternative considered:** Store coarse-tile equivalents and multiply by ratio everywhere
- Rejected: Error-prone (easy to forget multiplication), clutters code with `* SUBDIVISION_RATIO` everywhere, harder to audit

### Decision 3: Ship anchor = top-left tile
**Choice:** `ship.x` and `ship.y` represent the top-left tile of the ship's occupied footprint. `getOccupiedTiles()` expands rightward (+x) and downward (+y) from the anchor.

**Rationale:**
- Consistent with HTML Canvas coordinate system (origin at top-left)
- Consistent with 2D array indexing conventions used by `GameMap.tiles[][]`
- Simple footprint math: Frigate (2×1 horizontal) occupies `[(x,y), (x+1,y)]`, Flagship (2×2) occupies `[(x,y), (x+1,y), (x,y+1), (x+1,y+1)]`
- Renderer already draws tiles from top-left corner

**Alternative considered:** Center-based anchor
- Rejected: Requires rounding for even-dimensioned ships (2×2 has no single center tile), complicates `getOccupiedTiles()` with offset math

### Decision 4: Camera class with canvas transform for zoom/pan
**Choice:** Create a `Camera` class managing zoom level and pan offset, applied as `ctx.setTransform()` wrapping all rendering in `Renderer.render()`. `InputHandler` uses the camera's inverse transform to convert screen coordinates to grid coordinates.

**Rationale:**
- All existing rendering code draws in grid-to-canvas space; the camera transform is a single outer wrapper
- `screenToGrid()` and `gridToScreen()` in Renderer are the sole integration points — add camera transform there
- Screen shake composes naturally: apply shake offset after camera transform
- No existing draw calls need modification — they still draw at grid coordinates

**Alternative considered:** Re-render at different scales by adjusting tile size
- Rejected: Would require rewriting all draw calls that use `tileSize` for sizing (ship shapes, HP bars, effects), and wouldn't support fractional zoom levels

### Decision 5: Frigate orientation derived from movement direction
**Choice:** Frigates automatically orient horizontally or vertically based on their last movement delta. If `|dx| > |dy|`, orientation is horizontal; if `|dy| > |dx|`, vertical. Equal deltas preserve current orientation. No explicit player control over orientation.

**Rationale:**
- Reduces UI complexity — no additional button or mode for rotation
- Orientation becomes a tactical consequence of movement decisions, adding depth without adding controls
- Ship already has an unused `facing` property that can be repurposed
- Matches the natural expectation: a ship moving east/west is oriented horizontally

**Alternative considered:** Player selects orientation after each move
- Rejected: Adds a mandatory interaction step every move, slowing gameplay; doesn't add proportional tactical value since players can achieve desired orientation through movement direction

### Decision 6: Portrait board = transposed dimensions
**Choice:** Portrait board uses the landscape dimensions transposed: 15×20 at 1× (30×40 at 2×). Same total tile count, same canvas pixel area (900×1200 for portrait vs 1200×900 for landscape).

**Rationale:**
- Identical total tile count preserves game balance — same number of islands, same fleet composition, same movement-to-board-size ratio
- Canvas pixel area is identical, just rotated — no performance difference
- Simple implementation: swap WIDTH and HEIGHT in GRID constant based on layout setting

**Alternative considered:** Different total area for portrait (e.g., 12×25)
- Rejected: Different tile counts unbalance island density, fleet spacing, and movement ranges between layouts

### Decision 7: Ship center = geometric center of footprint
**Choice:** Ship center point is calculated as the geometric center of all occupied tile centers. For firing range, vision range, and line-of-sight, distances are measured from this center point. For a 2×2 Flagship at anchor (x, y), center is `(x + 0.5, y + 0.5)`.

**Rationale:**
- Unbiased — not skewed toward any edge of the ship
- Works for any footprint shape (1×1, 2×1, 2×2)
- For 1×1 ships (Sloops), center is `(x + 0.5, y + 0.5)` — equivalent to current tile-center behavior
- Manhattan distance from fractional center still yields reasonable integer-comparable results

**Alternative considered:** Anchor tile as reference point for all distance checks
- Rejected: Biased toward top-left; two ships could have different effective ranges depending on relative orientation

### Decision 8: Coordinate transform pipeline
**Choice:** The full pipeline is: screen coords → CSS scale correction → camera inverse → canvas coords → grid floor division. For rendering: grid coords → canvas coords → camera transform → screen coords.

**Rationale:**
- `InputHandler.handleCanvasClick()` already applies CSS scale correction (`canvas.width / rect.width`); camera inverse is inserted immediately after
- `Renderer.screenToGrid()` already does floor division; camera transform is inserted immediately before
- Clean layering — each transform step is independent and testable
- Existing code changes are minimal: two insertion points

**Alternative considered:** Merge camera and CSS correction into a single matrix
- Rejected: Harder to reason about, harder to debug, no measurable performance benefit for 2D games

## Risks / Trade-offs

### [Risk] Performance at 40×30 fog rendering
Fog overlay draws a semi-transparent rectangle per out-of-vision tile. At 40×30, that's up to 1,200 rectangles per frame vs current 300.
**Mitigation:**
- 1,200 `fillRect` calls is still trivial for modern Canvas 2D (browsers batch these internally)
- If needed, cache fog as an offscreen canvas and only redraw when vision changes (vision only changes on ship movement, not every frame)

### [Risk] Touch gesture conflicts with click-to-select
Pinch-to-zoom and pan gestures could conflict with single-tap ship selection on touch devices.
**Mitigation:**
- Use gesture detection thresholds: single tap (< 200ms, < 10px movement) = click; multi-touch = zoom/pan; single-touch drag (> 10px) = pan
- Standard pattern used by map applications — well-established UX

### [Risk] Multi-tile BFS pathfinding complexity
Current BFS in `Ship.getValidMovePositions()` checks single tiles. Multi-tile ships must check all occupied tiles at each candidate position.
**Mitigation:**
- BFS node count unchanged (still bounded by movement range)
- Per-node validation increases from 1 tile check to N tile checks (max 4 for Flagship)
- At worst: 10 movement range × ~100 reachable positions × 4 tiles = 400 collision checks per pathfinding call — negligible

### [Risk] Portrait board balance may differ from landscape
Top/bottom starting zones on a portrait board create a different spatial dynamic than left/right on landscape.
**Mitigation:**
- Same total tile count and same fleet composition ensure mechanical parity
- Island generation is proportional to grid dimensions, so density is preserved
- Playtest both layouts and adjust MAP_GENERATION constants per layout if needed

### [Risk] No existing specs for most modified capabilities
The proposal lists `ship-movement`, `ship-placement`, `collision-detection`, etc. as modified capabilities, but no formal specs exist for them.
**Mitigation:**
- Following project precedent (see fog-of-war design.md lines 161-168): treat as new capabilities with ADDED Requirements in delta specs
- When archived, these become the baseline for future changes

### [Risk] Screen shake interaction with camera transform
Current screen shake uses `ctx.translate(shakeOffset.x, shakeOffset.y)`. With a camera transform wrapping rendering, shake must compose correctly at different zoom levels.
**Mitigation:**
- Apply shake offset in screen space (after camera transform), not in grid space
- This ensures shake magnitude is constant regardless of zoom level — a 4px shake stays 4px on screen

## Migration Plan

**Implementation order:**
1. Add subdivision constants, scaled values, and board layout config to `shared/constants.js`
2. Implement Ship data model changes (orientation, `getOccupiedTiles()`, `getCenterPoint()`)
3. Update collision detection for multi-tile footprints
4. Update board layout and starting zone logic
5. Update combat system for center-based ranges and nearest-tile boarding
6. Update fog of war for center-based vision and full-footprint ghost ships
7. Update Renderer for multi-tile ship rendering
8. Implement Camera class and integrate with Renderer
9. Implement touch gesture handling in InputHandler
10. Add board layout UI to game creation
11. Update grid/fog overlay rendering for new tile count
12. Integration testing across all systems

**Rollback strategy:**
- Set `SUBDIVISION_RATIO = 1` and restore original constant values — all systems revert to single-tile behavior
- Camera class can be disabled by setting zoom=1, offset=(0,0) — rendering reverts to current behavior
- Board layout can default to landscape — no portrait-specific code paths execute

**Testing checklist:**
- Movement with all ship types at multi-tile footprints
- Collision with islands, boundaries, and other multi-tile ships
- Firing range at scaled values from ship centers
- Boarding with nearest-tile adjacency between all ship type combinations
- Fog of war vision from ship center, ghost ships at full footprint
- Zoom/pan on touch device (or touch emulation)
- Portrait and landscape board layouts
- Landscape regression (current gameplay preserved at 2× scale)
- Performance profiling at 40×30 grid

## Open Questions

1. **Zoom level limits:** What should max zoom be? Suggestion: max zoom = 3× (individual 30px cells appear as 90px), min zoom = fit-to-canvas (full board visible). Finalize during implementation based on feel.

2. **Zoom/pan on desktop:** Currently scoped as touch-only. Should mouse wheel zoom be added? Could be a follow-up enhancement if desktop players request it.

3. **Wind system interaction:** Wind currently affects movement direction. With multi-tile ships, does wind apply to each tile independently or to the ship as a unit? Current assumption: wind applies to the ship as a unit (single movement calculation, then validate all tiles). Verify during implementation.
