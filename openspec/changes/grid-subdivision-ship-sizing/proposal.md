## Why

Enable more tactical ship positioning and naval combat by introducing variable ship sizes that reflect the power differences between vessel classes. Currently all ships occupy a single grid space regardless of size, limiting tactical depth. Multi-tile ships create meaningful positioning decisions, add visual distinction between ship classes, and make size-2 frigates feel substantively different from size-1 sloops and size-3 flagships.

Additionally, the current fixed landscape board doesn't adapt well to portrait-oriented mobile devices. Supporting both landscape and portrait board layouts — chosen as a game setting — ensures the experience works well regardless of device orientation.

## What Changes

- **Grid Subdivision**: Increase grid resolution by subdividing each current tile into smaller cells. The subdivision ratio and resulting grid dimensions are design-time decisions, but the grid must be fine enough to support multi-tile ship footprints with meaningful positioning granularity.
- **Variable Ship Footprints**:
  - Size-1 ships (Sloops) occupy 1 grid cell
  - Size-2 ships (Frigates) occupy 2 grid cells in a line
  - Size-3 ships (Flagships) occupy 4 grid cells in a 2×2 block
- **Dynamic Orientation**: Size-2 ships automatically orient horizontally or vertically based on their last movement direction
- **Uniform Value Scaling**: **BREAKING** - All tile-based gameplay values (movement, firing range, vision range, map generation constants) scale proportionally with the grid subdivision ratio. This preserves existing gameplay balance exactly — a Sloop with range 2 at 1× becomes range 4 at 2× subdivision, covering the same effective area.
- **Multi-Tile Collision**: Ships check all occupied tiles for collisions with islands, map boundaries, and other ships
- **Nearest-Tile Adjacency**: Proximity checks between multi-tile ships (boarding, adjacency) use nearest-tile-to-nearest-tile distance — two ships are adjacent if any occupied tile of one is Manhattan distance 1 from any occupied tile of the other. Firing range and vision use ship center (average of occupied tiles).
- **Board Aspect Ratio Setting**: Players can choose between a landscape board layout (wider than tall, suited for desktop) and a portrait board layout (taller than wide, suited for mobile) when creating a game. The game auto-suggests a layout based on the creator's device orientation. Both layouts use the same subdivision ratio and ship sizing rules; only the grid dimensions and aspect ratio differ. In future multiplayer, the game creator's board settings apply to all players who join — zoom and pan capabilities ensure any board shape is playable on any device.
- **Portrait Starting Zones**: On portrait boards, player starting zones shift from left/right to top/bottom placement, maximizing the distance between fleets along the board's longer axis. Landscape boards retain the current left/right placement.
- **Mobile Board Interaction**: On touch devices, the game board supports pinch-to-zoom and pan gestures so players can zoom into regions of the board for precise interaction, then zoom back out for strategic overview. The full board is always visible at the default zoom level.
- **Fog of War Compatibility**: Vision radiates from ship center point regardless of ship footprint size. Ghost ships (last-known enemy positions) render at full multi-tile footprint so the ghost visually matches the actual ship class.

## Capabilities

### New Capabilities
- `multi-tile-ships`: Ships occupy multiple grid cells based on their size, with dynamic orientation for size-2 vessels
- `fine-grid-coordinates`: Internal coordinate system using a subdivided grid while maintaining equivalent visual scale
- `ship-orientation-tracking`: Size-2 ships track and update orientation (horizontal/vertical) based on movement direction
- `board-aspect-ratio`: Game setting to choose between landscape and portrait board layouts, affecting grid dimensions, canvas aspect ratio, and starting zone placement
- `board-zoom-pan`: Pinch-to-zoom and pan gestures for navigating the game board on touch devices
- `nearest-tile-adjacency`: Proximity checks between multi-tile ships use minimum distance between any pair of occupied tiles

### Modified Capabilities
- `ship-movement`: **BREAKING** - Movement values scale with grid subdivision ratio; multi-tile collision detection for all movement
- `ship-placement`: Fleet initialization and ship positioning must respect multi-tile footprints and validate all occupied cells. Starting zones adapt to board orientation (left/right for landscape, top/bottom for portrait)
- `collision-detection`: Map collision checks must validate all tiles a ship would occupy, not just a single position
- `ship-rendering`: Visual rendering scales ship sizes and shapes to match their grid footprint (1×1, 2×1, or 2×2 cells)
- `combat-ranges`: **BREAKING** - Firing range values scale with grid subdivision ratio; range checks use ship center for firing but nearest-tile distance for boarding
- `fog-of-war`: Vision calculations use ship center point; ghost ships render at full multi-tile footprint; vision range values scale with subdivision ratio
- `map-generation`: Island count, island sizes, edge buffers, and starting zone sizes all scale with the subdivision ratio to maintain equivalent map density and spacing

## Impact

**Core Systems Affected:**
- `shared/constants.js` - Grid dimensions, tile size, all tile-based gameplay values (movement, range, vision, map generation), board layout configurations, subdivision ratio
- `client/src/entities/Ship.js` - Add orientation property, getOccupiedTiles(), updated moveTo(), nearest-tile adjacency for boarding
- `client/src/map/GameMap.js` - Multi-tile collision detection, enhanced placement validation, board layout awareness, portrait starting zone logic
- `client/src/core/Game.js` - Movement validation using multi-tile footprints, board layout setting
- `client/src/ui/Renderer.js` - Ship rendering scaled to footprint size, zoom/pan camera transform, ghost ship footprint rendering
- `client/src/entities/Fleet.js` - Starting positions adapted to subdivided grid coordinates, top/bottom zones for portrait boards
- `client/src/core/InputHandler.js` - Pinch-to-zoom and pan gesture handling, coordinate transforms through camera at varying zoom levels
- `client/src/fog/FogOfWar.js` - Vision from ship center, ghost ship last-known position stores full footprint, scaled vision ranges
- `client/src/combat/CombatResolver.js` - Range checks from ship center with scaled range values
- `client/src/combat/BoardingSystem.js` - Nearest-tile adjacency check instead of center-to-center
- Game creation UI - Board layout selection (landscape / portrait)

**Behavior Changes:**
- All tile-based gameplay values (movement, range, vision, map generation) scale uniformly with the subdivision ratio, preserving current balance
- Size-2 ships will visibly rotate orientation when changing primary movement axis
- Larger ships require more careful positioning and can be blocked by narrow passages
- Firing range and vision use ship center; boarding and adjacency use nearest-tile distance
- Ghost ships in fog of war render at full multi-tile footprint matching the ship class
- On mobile, players can zoom into the board for precise ship selection and targeting, then zoom out for overview
- Board layout auto-suggested based on device orientation at game creation; portrait fills mobile screens naturally, landscape remains typical for desktop
- Portrait boards place starting fleets at top and bottom; landscape boards retain left and right placement
- Currently single-device; board setting chosen once per game and applies to all future multiplayer participants

**No Breaking Changes For:**
- Map generation (island density and spacing preserved through uniform scaling)
- Turn management or game flow
