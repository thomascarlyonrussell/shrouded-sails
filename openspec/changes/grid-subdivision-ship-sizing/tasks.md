## 1. Grid Constants & Subdivision Foundation

- [ ] 1.1 Add `SUBDIVISION_RATIO = 2` constant to `shared/constants.js`
- [ ] 1.2 Update `GRID.WIDTH` to 40, `GRID.HEIGHT` to 30, `GRID.TILE_SIZE` to 30 in `shared/constants.js`
- [ ] 1.3 Add `BOARD_LAYOUTS` configuration object with landscape (40×30) and portrait (30×40) dimension sets
- [ ] 1.4 Scale all `SHIP_TYPES` movement values: Sloop 5→10, Frigate 4→8, Flagship 3→6
- [ ] 1.5 Scale all `SHIP_TYPES` range values: Sloop 2→4, Frigate 3→6, Flagship 3→6
- [ ] 1.6 Scale all `SHIP_TYPES` vision values: Sloop 4→8, Frigate 3→6, Flagship 2→4
- [ ] 1.7 Scale `MAP_GENERATION` constants: `EDGE_BUFFER` 2→4, `STARTING_ZONE_SIZE` 4→8, scale island size min/max
- [ ] 1.8 Add ship footprint definitions to `SHIP_TYPES`: Sloop `{width: 1, height: 1}`, Frigate `{width: 2, height: 1}`, Flagship `{width: 2, height: 2}`
- [ ] 1.9 Update `CANVAS.WIDTH` and `CANVAS.HEIGHT` derivation to use new GRID values (verify 1200×900 preserved for landscape)

## 2. Ship Data Model (Multi-Tile + Orientation)

- [ ] 2.1 Add `orientation` property to Ship constructor in `client/src/entities/Ship.js` (default: `'horizontal'`, only meaningful for Frigates)
- [ ] 2.2 Add `getOccupiedTiles()` method to Ship that returns array of `{x, y}` positions based on anchor, footprint, and orientation
- [ ] 2.3 Add `getCenterPoint()` method to Ship that returns geometric center `{x, y}` of occupied tiles
- [ ] 2.4 Update `moveTo()` in Ship to update orientation based on movement delta (|dx| > |dy| → horizontal, |dy| > |dx| → vertical, equal → preserve)
- [ ] 2.5 Update `moveTo()` to set anchor position correctly (ship.x, ship.y = top-left of new footprint)

## 3. Collision Detection System

- [ ] 3.1 Update `GameMap.isValidPosition()` in `client/src/map/GameMap.js` to accept optional footprint and check all tiles
- [ ] 3.2 Add `GameMap.isFootprintClear(x, y, footprint, orientation, excludeShip)` method that checks all tiles for bounds, islands, and ship overlap
- [ ] 3.3 Update `GameMap.getShipAt(x, y)` to check against all ships' occupied tiles, not just anchor positions
- [ ] 3.4 Update `Ship.getValidMovePositions()` in `client/src/entities/Ship.js` to validate full footprint at each BFS candidate position
- [ ] 3.5 Update BFS in `getValidMovePositions()` to account for orientation changes when Frigate moves in a new direction
- [ ] 3.6 Update `GameMap.addShip()` and `GameMap.removeShip()` to register/deregister all occupied tiles

## 4. Board Layout & Starting Zones

- [ ] 4.1 Add `boardLayout` parameter to Game constructor in `client/src/core/Game.js` (default: `'landscape'`)
- [ ] 4.2 Update `GameMap` constructor to accept layout parameter and set `this.width`/`this.height` from `BOARD_LAYOUTS[layout]`
- [ ] 4.3 Update `CANVAS.WIDTH`/`CANVAS.HEIGHT` derivation to be dynamic based on board layout
- [ ] 4.4 Update `GameMap.isInStartingZone()` to use top/bottom zones for portrait layout, left/right for landscape
- [ ] 4.5 Update `Fleet.getStartingPositions()` in `client/src/entities/Fleet.js` to place Player 1 at top, Player 2 at bottom for portrait layout
- [ ] 4.6 Update `Fleet.deployShips()` to validate multi-tile footprints fit within starting zones during placement

## 5. Map Generation Scaling

- [ ] 5.1 Verify `GameMap.generateIslands()` works correctly with scaled `MAP_GENERATION` constants at 40×30
- [ ] 5.2 Verify `GameMap.generateSingleIsland()` respects scaled `EDGE_BUFFER` for island placement
- [ ] 5.3 Verify `GameMap.placeIslandCluster()` produces island clusters at appropriate scaled sizes
- [ ] 5.4 Test island density visually — should look equivalent to current 20×15 map

## 6. Combat System Updates

- [ ] 6.1 Update `Ship.getAttackableTargets()` in `client/src/entities/Ship.js` to calculate distance from `getCenterPoint()` to target's `getCenterPoint()`
- [ ] 6.2 Update `GameMap.getDistance()` in `client/src/map/GameMap.js` to support fractional center-point coordinates
- [ ] 6.3 Update `GameMap.hasLineOfSight()` to trace from attacker center to target center
- [ ] 6.4 Update `Ship.getBoardableTargets()` to use nearest-tile adjacency: loop attacker's `getOccupiedTiles()` against target's `getOccupiedTiles()`, check min Manhattan distance = 1
- [ ] 6.5 Update `CombatResolver.calculateHitChance()` in `client/src/combat/CombatResolver.js` to use center-to-center distance for range modifier
- [ ] 6.6 Update `BoardingSystem` in `client/src/combat/BoardingSystem.js` to use nearest-tile adjacency validation

## 7. Fog of War Compatibility

- [ ] 7.1 Update `FogOfWar.calculateVisionCoverage()` in `client/src/fog/FogOfWar.js` to radiate vision from each ship's `getCenterPoint()`
- [ ] 7.2 Update `FogOfWar.isShipVisible()` to use center-to-center Manhattan distance for visibility checks
- [ ] 7.3 Update `FogOfWar.updateLastKnownPositions()` to store anchor position, ship type, and orientation for ghost ship footprint
- [ ] 7.4 Update `FogOfWar.getGhostShips()` to return ghost data including footprint information (anchor, type, orientation)
- [ ] 7.5 Verify `FogOfWar.isPositionVisible()` works correctly at fine-grid coordinates

## 8. Ship Rendering (Multi-Tile)

- [ ] 8.1 Update `Renderer.drawShips()` in `client/src/ui/Renderer.js` to calculate ship drawing area from `getOccupiedTiles()` bounding box
- [ ] 8.2 Update Sloop shape drawing to render within 1×1 tile area (minimal change, verify proportions at 30px tile)
- [ ] 8.3 Update Frigate shape drawing to render across 2×1 or 1×2 tile area based on orientation
- [ ] 8.4 Update Flagship shape drawing to render across 2×2 tile area
- [ ] 8.5 Update `drawHPBar()` to position and size relative to full footprint width
- [ ] 8.6 Update `drawActionIndicators()` (M/A badges) to position relative to footprint area
- [ ] 8.7 Update `drawCompletedOverlay()` (DONE overlay) to cover full footprint area
- [ ] 8.8 Update `drawSelection()` (yellow outline + corner brackets) to surround full footprint area
- [ ] 8.9 Update `drawHoveredShipHighlight()` (cyan dashed outline) to surround full footprint area

## 9. Ghost Ship Rendering

- [ ] 9.1 Update `Renderer.drawGhostShip()` to accept footprint data (anchor, type, orientation) from ghost ship record
- [ ] 9.2 Render ghost Frigates at full 2×1 or 1×2 footprint matching stored orientation
- [ ] 9.3 Render ghost Flagships at full 2×2 footprint
- [ ] 9.4 Verify ghost Sloops render unchanged (single tile)

## 10. Camera System (Zoom/Pan)

- [ ] 10.1 Create `Camera` class (new file `client/src/ui/Camera.js`) with properties: `zoom`, `offsetX`, `offsetY`
- [ ] 10.2 Add methods: `setZoom(level, centerX, centerY)`, `pan(dx, dy)`, `reset()`, `clampToBounds(canvasWidth, canvasHeight, boardWidth, boardHeight)`
- [ ] 10.3 Add `screenToCanvas(screenX, screenY)` method that applies inverse camera transform
- [ ] 10.4 Add `canvasToScreen(canvasX, canvasY)` method that applies camera transform
- [ ] 10.5 Integrate Camera into `Renderer` constructor — store camera reference
- [ ] 10.6 Update `Renderer.render()` to apply `ctx.setTransform()` with camera zoom and offset before all drawing
- [ ] 10.7 Apply screen shake offset in screen space (after camera transform) so shake magnitude is zoom-independent
- [ ] 10.8 Update `Renderer.screenToGrid()` to pass through camera inverse transform before floor division

## 11. Touch Input (Zoom/Pan Gestures)

- [ ] 11.1 Add touch event listeners (`touchstart`, `touchmove`, `touchend`, `touchcancel`) to `InputHandler` in `client/src/core/InputHandler.js`
- [ ] 11.2 Implement pinch-to-zoom detection: track two touch points, calculate distance delta, update camera zoom centered on pinch midpoint
- [ ] 11.3 Implement pan detection: single-finger drag when zoomed in (movement > 10px threshold), update camera offset
- [ ] 11.4 Implement tap detection: single touch < 200ms and < 10px movement, treated as click
- [ ] 11.5 Set zoom limits: minimum = full board visible (1×), maximum = 3× (design.md open question — adjust based on feel)
- [ ] 11.6 Prevent pan when at default zoom (full board visible)

## 12. Board Layout UI

- [ ] 12.1 Add board layout selector (landscape/portrait toggle or radio buttons) to game creation flow in `client/src/ui/SettingsMenu.js`
- [ ] 12.2 Implement auto-suggestion: detect `window.innerWidth` vs `window.innerHeight` on load, pre-select matching layout
- [ ] 12.3 Pass selected board layout to `Game` constructor when initializing a new game
- [ ] 12.4 Update canvas element sizing (CSS) to match portrait aspect ratio when portrait layout is selected

## 13. Grid & Fog Overlay Rendering

- [ ] 13.1 Verify `Renderer.drawGrid()` renders correctly at 40×30 (or 30×40 portrait) tile count
- [ ] 13.2 Verify `Renderer.drawMap()` renders island tiles correctly at 30px tile size
- [ ] 13.3 Update `Renderer.drawFogOverlay()` to render fog rectangles at fine-grid tile size
- [ ] 13.4 Performance check: profile fog overlay rendering at 1,200 tiles per frame, implement offscreen canvas cache if needed

## 14. Input Handler Updates

- [ ] 14.1 Update `InputHandler.handleCanvasClick()` to pass coordinates through camera inverse transform before `screenToGrid()`
- [ ] 14.2 Update `InputHandler.handleCanvasHover()` to pass coordinates through camera inverse transform
- [ ] 14.3 Update ship selection logic to check all occupied tiles — clicking any tile of a multi-tile ship SHALL select that ship
- [ ] 14.4 Verify keyboard shortcuts (M, F, B, Enter, Escape) continue to work unchanged

## 15. Integration Testing

- [ ] 15.1 Test Sloop movement at fine-grid coordinates (10 movement range, single-tile collision)
- [ ] 15.2 Test Frigate movement with orientation changes and 2×1 collision validation
- [ ] 15.3 Test Flagship movement with 2×2 collision near islands and map boundaries
- [ ] 15.4 Test firing range at scaled values from ship centers (center-to-center distance)
- [ ] 15.5 Test boarding with nearest-tile adjacency between all ship type combinations
- [ ] 15.6 Test fog of war vision from ship center points at scaled vision ranges
- [ ] 15.7 Test ghost ships render at full multi-tile footprint with correct orientation
- [ ] 15.8 Test pinch-to-zoom and pan on touch device (or browser touch emulation)
- [ ] 15.9 Test portrait board layout: starting zones at top/bottom, correct canvas sizing
- [ ] 15.10 Test landscape board layout: regression — verify current gameplay preserved at 2× scale
- [ ] 15.11 Performance test: verify acceptable frame rate at 40×30 grid with fog overlay and all ships rendered
- [ ] 15.12 Test ship selection by clicking any occupied tile of a multi-tile ship
