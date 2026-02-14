## 1. Core Vision System

- [x] 1.1 Add vision range constants to Constants.js (Sloop=4, Frigate=3, Flagship=2)
- [x] 1.2 Add getVisionRange() method to Ship class that returns vision range based on ship type
- [x] 1.3 Create FogOfWar.js class with constructor accepting game reference
- [x] 1.4 Implement FogOfWar.calculateVisionCoverage() to return all tiles within vision of friendly fleet using Manhattan distance
- [x] 1.5 Implement FogOfWar.isShipVisible(ship) to check if enemy ship is within friendly vision range with line-of-sight
- [x] 1.6 Add FogOfWar.isPositionVisible(x, y) to check if a specific position is within vision coverage

## 2. Last-Known Position Tracking

- [x] 2.1 Add lastKnownPositions map to FogOfWar class to store enemy ship positions by ship ID
- [x] 2.2 Implement FogOfWar.updateLastKnownPositions(visibleEnemyShips) to record positions of currently visible enemies
- [x] 2.3 Implement FogOfWar.getGhostShips() to return array of {ship, lastX, lastY} for enemies not currently visible but previously seen
- [x] 2.4 Add FogOfWar.clearGhostShip(shipId) to remove ghost when enemy re-spotted at new location or destroyed
- [x] 2.5 Call updateLastKnownPositions() in Game.js after each render to keep positions current

## 3. Fog Overlay Rendering

- [x] 3.1 Add drawFogOverlay() method to Renderer.js that renders semi-transparent rectangles over out-of-vision tiles
- [x] 3.2 Integrate FogOfWar.calculateVisionCoverage() call in drawFogOverlay() to determine which tiles to fog
- [x] 3.3 Ensure islands are NOT fogged (skip island tiles in fog rendering loop)
- [x] 3.4 Set fog color to rgba(0, 0, 0, 0.5) for dark semi-transparent overlay
- [x] 3.5 Call drawFogOverlay() in Renderer.render() after drawing terrain but before drawing ships

## 4. Ghost Ship Rendering

- [x] 4.1 Add drawGhostShip(ship, x, y) method to Renderer.js with reduced opacity (0.4)
- [x] 4.2 Render ghost ships using same shape as real ships but with translucent fill
- [x] 4.3 Add dashed border to ghost ships for additional visual differentiation
- [x] 4.4 Ensure ghost ships do NOT show HP bars, action badges, or DONE overlays
- [x] 4.5 Call FogOfWar.getGhostShips() in Renderer.render() and draw each ghost ship
- [x] 4.6 Draw ghost ships after real ships so they don't overlap incorrectly

## 5. Enemy Ship Visibility Filtering

- [x] 5.1 Update Renderer.drawShips() to check FogOfWar.isShipVisible() before rendering enemy ships
- [x] 5.2 Only render enemy ships that are currently in vision (not ghost ships)
- [x] 5.3 Ensure friendly ships are always rendered regardless of fog state
- [x] 5.4 Update ship info display (HP bars, action badges) to only show for visible enemy ships

## 6. Attack Targeting Restrictions

- [x] 6.1 Update Ship.getAttackableTargets() to filter enemies by FogOfWar.isShipVisible()
- [x] 6.2 Add safety check in CombatResolver.performAttack() to prevent attacks on non-visible targets
- [x] 6.3 Update ActionMenu or InputHandler to disable attack button when no visible targets in range
- [x] 6.4 Ensure ghost ships are NOT selectable as attack targets in UI

## 7. Boarding Targeting Restrictions

- [x] 7.1 Update Ship.getBoardableTargets() to filter enemies by FogOfWar.isShipVisible()
- [x] 7.2 Add safety check in BoardingSystem.attemptBoarding() to prevent boarding non-visible targets
- [x] 7.3 Update ActionMenu or InputHandler to disable board button when no visible targets adjacent
- [x] 7.4 Ensure ghost ships are NOT selectable as boarding targets in UI

## 8. Movement and Ghost Ship Interaction

- [x] 8.1 Ensure Ship.getValidMovePositions() does NOT treat ghost ship positions as occupied
- [x] 8.2 Allow friendly ships to move through or onto ghost ship positions
- [x] 8.3 When friendly ship moves onto ghost position, check if enemy is actually there and update vision

## 9. Game Integration

- [x] 9.1 Add fogOfWar property to Game class (initially null)
- [x] 9.2 Initialize FogOfWar in Game constructor if fog setting enabled (FogOfWar instance or null)
- [x] 9.3 Add fogEnabled setting to Game with default value true
- [x] 9.4 Update Renderer constructor to accept fogOfWar reference from Game
- [x] 9.5 Pass fogOfWar reference to Ship methods that need visibility checks (getAttackableTargets, getBoardableTargets)

## 10. Settings Menu

- [x] 10.1 Create SettingsMenu.js class with constructor
- [x] 10.2 Add HTML elements for settings menu overlay (hidden by default)
- [x] 10.3 Add "Fog of War" checkbox to settings menu with label and description
- [x] 10.4 Add event listener to fog checkbox to update Game.fogEnabled setting
- [x] 10.5 Add "New Game" button in main menu or title screen that shows settings menu before starting
- [x] 10.6 Update Game initialization to read fogEnabled setting and conditionally create FogOfWar
- [x] 10.7 Add CSS styling for settings menu (centered modal, backdrop, readable typography)

## 11. Vision Updates on Ship Movement

- [x] 11.1 Ensure FogOfWar.calculateVisionCoverage() is called every frame in render loop
- [x] 11.2 Verify fog overlay updates correctly when friendly ships move
- [x] 11.3 Verify ghost ships appear when enemy moves out of vision
- [x] 11.4 Verify ghost ships disappear when enemy re-spotted at new location
- [x] 11.5 Test that destroyed friendly ships correctly reduce vision coverage

## 12. Line-of-Sight Integration

- [x] 12.1 Reuse GameMap.hasLineOfSight() method for vision blocking by islands
- [x] 12.2 Ensure FogOfWar.isShipVisible() checks both distance AND line-of-sight
- [x] 12.3 Test that islands correctly block vision between friendly and enemy ships
- [x] 12.4 Verify diagonal line-of-sight corner checking works for vision (same as attacks)

## 13. Testing and Validation

- [x] 13.1 Test Sloop with vision range 4 can see 4 tiles away in all directions
- [x] 13.2 Test Frigate with vision range 3 can see 3 tiles away in all directions
- [x] 13.3 Test Flagship with vision range 2 can see only 2 tiles away in all directions
- [x] 13.4 Test shared fleet vision - enemy visible to any friendly ship is visible to player
- [x] 13.5 Test ghost ships appear at last-known position when enemy moves out of all friendly vision
- [x] 13.6 Test ghost ships disappear when enemy re-spotted at different location
- [x] 13.7 Test fog overlay renders only on out-of-vision water tiles (not islands)
- [x] 13.8 Test attacks cannot target enemies outside vision range
- [x] 13.9 Test boarding cannot target enemies outside vision range
- [x] 13.10 Test fog toggle in settings correctly enables/disables fog system
- [x] 13.11 Test fog disabled shows all enemy ships like classic mode
- [x] 13.12 Test ghost ships not selectable for attacks or boarding
- [x] 13.13 Test friendly ships can move through ghost ship positions
- [x] 13.14 Test performance with all 12 ships on board (verify ≥30 FPS)

## 14. Polish and Edge Cases

- [x] 14.1 Add tooltip or help text explaining fog of war in settings menu
- [x] 14.2 Ensure ghost ship visual clearly distinguishable from real ships (verify opacity/dashed border)
- [x] 14.3 Handle case where enemy ship destroyed while out of vision (ghost persists until area explored)
- [x] 14.4 Ensure wind drift updates vision correctly (ships moved by wind trigger vision recalculation)
- [x] 14.5 Test turn switching maintains correct fog state for new active player
- [x] 14.6 Verify ship panel (side panels) respects fog - only show visible enemy ship details
