## Context

The naval combat game currently provides perfect information - both players can see all enemy ships, their exact positions, HP, and action states at all times. This eliminates tactical depth around reconnaissance, positioning, and surprise. The fog of war system introduces imperfect information by hiding enemy ships outside friendly vision range, creating meaningful scouting decisions and rewarding fleet positioning.

**Current State:**
- All ships always visible to both players
- No distinction between ship types for reconnaissance value
- Combat range and vision are implicitly the same
- No mechanism for tracking previously seen but now hidden information

**Constraints:**
- Must maintain performance with real-time fog rendering on every frame
- Cannot break existing combat mechanics (line-of-sight, damage calculation, turn flow)
- Must be toggleable to support both classic and tactical gameplay modes
- Ghost ships must be clearly distinguishable from real ships to prevent confusion

**Stakeholders:**
- Players wanting more tactical depth
- Players preferring classic "perfect information" gameplay

## Goals / Non-Goals

**Goals:**
- Hide enemy ships outside friendly vision range with last-known position tracking
- Differentiate ship types by vision range (Sloop=4, Frigate=3, Flagship=2) to create scout/heavy roles
- Pool vision across friendly fleet for shared situational awareness
- Render fog overlay on unexplored areas and ghost ships at last-known positions
- Provide toggle to enable/disable fog of war at game setup
- Prevent attacks on targets outside vision range

**Non-Goals:**
- Hiding terrain/islands (all islands always visible for strategic planning)
- Changing existing combat damage mechanics or attack range calculations
- Adding fog-related special abilities or advanced scouting mechanics (e.g., reveal pulse)
- Animating fog transitions or providing particle effects
- Implementing fog for single-player AI (future consideration)
- Network multiplayer fog synchronization (game is local hot-seat)

## Decisions

### Decision 1: Centralized FogOfWar class vs distributed vision logic
**Choice:** Create a dedicated `FogOfWar` class in `js/fog/FogOfWar.js` to manage all vision and ghost ship tracking.

**Rationale:**
- Centralizes complex state management (last-known positions, vision coverage, ghost ships)
- Easier to toggle on/off without scattering conditionals throughout codebase
- Separates concerns - Game.js handles game flow, FogOfWar.js handles visibility
- Easier to test vision calculations in isolation

**Alternative considered:** Add vision methods to GameMap.js
- **Rejected because:** GameMap focuses on terrain/spatial queries; mixing visibility state would bloat the class

### Decision 2: Vision range calculation using Manhattan distance
**Choice:** Use Manhattan distance (|dx| + |dy|) for vision range, same as movement calculations.

**Rationale:**
- Consistent with existing movement system (ships move in Manhattan distance)
- Simpler calculation than Euclidean distance
- Matches grid-based game feel
- Existing line-of-sight code can be reused for vision blocking

**Alternative considered:** Euclidean distance with circular vision radius
- **Rejected because:** Inconsistent with movement system, more complex, doesn't fit grid aesthetics

### Decision 3: Ghost ships as separate render pass vs state flag on Ship objects
**Choice:** Ghost ships rendered separately using last-known position data stored in FogOfWar class, NOT as state on Ship objects.

**Rationale:**
- Ship objects remain clean - they represent actual ship state, not visibility state
- FogOfWar owns visibility concerns, avoiding cross-contamination
- Allows ghost ships to persist even if actual ship is destroyed/moved far away
- Easier to differentiate ghost rendering (opacity, no HP) from real ship rendering

**Alternative considered:** Add `isGhost` flag to Ship class
- **Rejected because:** Mixes game state with UI state, harder to manage when ship moves back into vision

### Decision 4: Fog rendering as canvas overlay vs per-tile fog sprites
**Choice:** Render fog as semi-transparent rectangles over each out-of-vision tile during Renderer pass.

**Rationale:**
- Simple implementation - just loop over tiles and draw overlay rectangles
- Fog can be recalculated every frame based on current ship positions
- No texture assets needed, just rgba color value
- Grid-aligned fog fits visual style

**Alternative considered:** Pre-render fog texture and mask it based on vision
- **Rejected because:** More complex, requires managing texture state, harder to debug, overkill for static fog

### Decision 5: Vision update frequency - every frame vs on movement events
**Choice:** Recalculate vision coverage every frame in the render loop.

**Rationale:**
- Simpler - no need to hook into movement/turn events
- Always up-to-date, no risk of stale vision state
- Performance acceptable - vision calculation is O(num_ships × vision_range), small for 12 ships
- Consistent with existing render approach (full redraw every frame)

**Alternative considered:** Only recalculate on ship movement/turn change
- **Rejected because:** Added complexity for marginal performance gain, harder to maintain correctness

### Decision 6: Attack targeting restriction - block at UI level vs block at combat resolver
**Choice:** Block targeting at UI level (Ship.getAttackableTargets filters by vision) AND at combat resolver level (safety check).

**Rationale:**
- UI filter prevents invalid targets from appearing in UI (better UX)
- Combat resolver check prevents exploits or bugs from bypassing UI filter (defense in depth)
- Minimal code duplication - both use same FogOfWar.isShipVisible() method

**Alternative considered:** Only block at UI level
- **Rejected because:** Risky - bug in UI could allow invalid attacks, harder to test

### Decision 7: Settings toggle implementation - in-game menu vs pre-game setup
**Choice:** Add fog of war toggle to a simple pre-game setup screen, NOT in-game menu.

**Rationale:**
- Changing fog mid-game would be jarring (suddenly revealing/hiding ships)
- Simpler implementation - no need to refactor game state mid-session
- Clearer user expectation - setting locked for game duration
- Can add Settings button to main menu/title screen

**Alternative considered:** In-game toggle in pause menu
- **Rejected because:** Complex state management, confusing UX (what happens to ghost ships?), not valuable

## Risks / Trade-offs

### [Risk] Performance degradation with fog rendering on every frame
**Mitigation:**
- Vision calculation is O(num_ships × vision_range²) ≈ O(12 × 16) = ~192 tile checks per frame
- Fog rendering is O(grid_width × grid_height) = 20 × 15 = 300 rectangles per frame
- Both operations are trivial for modern browsers with canvas 2D context
- If performance issues arise, add vision caching (only recalculate on movement)

### [Risk] Ghost ships confuse players - mistaken for real ships
**Mitigation:**
- Clear visual differentiation: reduced opacity (0.3-0.4), no HP bar, no action badges
- Consider adding "?" icon or dashed outline for additional clarity
- Tooltips on hover: "Last seen at Turn X" (future enhancement)
- Player testing to validate visual design

### [Risk] Flagship vulnerability too punishing with vision range 2
**Trade-off:**
- **Intended design:** Flagships need escort ships to see effectively, rewarding fleet cohesion
- **If too harsh:** Can adjust vision ranges in Constants.js (Flagship: 2→3, others adjust proportionally)
- **Playtesting required** to validate balance

### [Risk] Last-known position tracking doesn't account for destroyed ships
**Current behavior:**
- If ship destroyed while out of vision, ghost persists at last-known position
- Only disappears when friendly ship moves to area and sees empty tile
**Trade-off:**
- **Acceptable:** Creates fog-of-war uncertainty - "Is that ship still there?"
- **Alternative:** Remove ghost when turn count exceeds reasonable movement range (complex, may add later)

### [Risk] Fog toggle default (enabled) may frustrate new players
**Mitigation:**
- Make toggle prominent in setup screen with clear label and description
- Consider "Classic Mode" vs "Tactical Mode" labels instead of "Fog Off" vs "Fog On"
- Add brief tooltip explaining what fog of war does
- Tutorial or first-game prompt (future enhancement)

### [Risk] No specs exist yet for modified capabilities
**Context:**
- Proposal lists `enemy-ship-visibility`, `ship-information-display`, `attack-targeting`, `game-settings` as modified
- But `openspec/specs/` directory is empty - these are effectively new capabilities
**Mitigation:**
- Treat as new capabilities (ADDED Requirements) for this change
- When archiving, these will be synced to main specs as baseline
- Future changes can then use MODIFIED against these baselines

## Migration Plan

**Deployment steps:**
1. Implement `FogOfWar` class with vision calculation and ghost tracking
2. Add vision ranges to `Constants.js` and `Ship` class
3. Update `Renderer.js` to call `FogOfWar.isShipVisible()` before rendering enemy ships
4. Add fog overlay rendering in `Renderer.js`
5. Add ghost ship rendering in `Renderer.js`
6. Update `Ship.getAttackableTargets()` to filter by vision
7. Add safety check in `CombatResolver.performAttack()` to block attacks on non-visible targets
8. Create simple settings menu with fog toggle (new `SettingsMenu.js`)
9. Update `Game.js` to initialize FogOfWar conditionally based on setting

**Rollback strategy:**
- If critical bugs found, default fog setting to "disabled" in Constants.js
- Fog system is isolated - can be disabled without removing code
- No database or persistent state changes - rollback is instant

**Testing checklist:**
- Verify vision ranges match specs for all ship types
- Test ghost ship appears when enemy moves out of vision
- Test ghost ship disappears when enemy re-spotted
- Test fog overlay renders correctly and updates with ship movement
- Test islands always visible through fog
- Test attacks blocked on targets outside vision
- Test settings toggle enables/disables fog correctly
- Test performance with all 12 ships moving (worst case)

## Open Questions

1. **Ghost ship visual design:** Opacity level (0.3? 0.4?) and additional indicators (question mark, dashed border)?
   - **Resolution plan:** Start with 0.4 opacity + dashed border, iterate based on playtesting

2. **Vision range balance:** Are Sloop=4, Frigate=3, Flagship=2 the right values?
   - **Resolution plan:** Initial values chosen to create 2:1.5:1 ratio with attack ranges, playtest and adjust

3. **Settings menu placement:** New "Settings" button on title screen, or in-game "New Game" flow?
   - **Resolution plan:** Add to "New Game" flow initially (simpler), consider dedicated settings screen later

4. **Ghost ship tooltip:** Should hovering show "Last seen: Turn X" or similar info?
   - **Resolution plan:** Not in initial implementation, add as enhancement if players request it

5. **Multiple players (future):** How does fog work in network multiplayer (not hot-seat)?
   - **Out of scope:** Game is local hot-seat only, network play is separate future feature
