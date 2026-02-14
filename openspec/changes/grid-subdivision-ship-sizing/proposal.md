## Why

Enable more tactical ship positioning and naval combat by introducing variable ship sizes that reflect the power differences between vessel classes. Currently all ships occupy a single grid space regardless of size, limiting tactical depth. Multi-tile ships create meaningful positioning decisions, add visual distinction between ship classes, and make size-2 frigates feel substantively different from size-1 sloops and size-3 flagships.

## What Changes

- **Grid Subdivision**: Expand game grid from 20×15 coarse tiles to 40×30 fine-grid cells while maintaining identical visual appearance (1200×900px canvas with 30px cells instead of 60px cells)
- **Variable Ship Footprints**: 
  - Size-1 ships (Sloops) occupy 1 grid cell
  - Size-2 ships (Frigates) occupy 2 grid cells in a line
  - Size-3 ships (Flagships) occupy 4 grid cells in a 2×2 block
- **Dynamic Orientation**: Size-2 ships automatically orient horizontally or vertically based on their last movement direction
- **Movement Scaling**: **BREAKING** - Double all ship movement values (Sloop 5→10, Frigate 4→8, Flagship 3→6) to maintain relative movement range in the subdivided grid
- **Multi-Tile Collision**: Ships check all occupied tiles for collisions with islands, map boundaries, and other ships

## Capabilities

### New Capabilities
- `multi-tile-ships`: Ships occupy multiple grid cells based on their size, with dynamic orientation for size-2 vessels
- `fine-grid-coordinates`: Internal coordinate system using 40×30 grid while maintaining 20×15 visual appearance
- `ship-orientation-tracking`: Size-2 ships track and update orientation (horizontal/vertical) based on movement direction

### Modified Capabilities
- `ship-movement`: **BREAKING** - Movement now operates on fine-grid coordinates (40×30) with doubled movement values and multi-tile collision detection
- `ship-placement`: Fleet initialization and ship positioning must respect multi-tile footprints and validate all occupied cells
- `collision-detection`: Map collision checks must validate all tiles a ship would occupy, not just a single position
- `ship-rendering`: Visual rendering scales ship sizes and shapes to match their grid footprint (1×1, 2×1, or 2×2 cells)

## Impact

**Core Systems Affected:**
- `js/utils/Constants.js` - Grid dimensions, tile size, and ship movement values
- `js/entities/Ship.js` - Add orientation property, getOccupiedTiles(), updated moveTo()
- `js/map/GameMap.js` - Multi-tile collision detection, enhanced placement validation
- `js/core/Game.js` - Movement validation using multi-tile footprints
- `js/ui/Renderer.js` - Ship rendering scaled to footprint size
- `js/entities/Fleet.js` - Starting positions converted to fine-grid coordinates

**Behavior Changes:**
- Ship movement ranges maintain same effective distance in "old tile" units due to doubled movement values
- Size-2 ships will visibly rotate orientation when changing primary movement axis
- Larger ships require more careful positioning and can be blocked by narrow passages
- Line-of-sight and range calculations use ship center (average of occupied tiles)

**No Breaking Changes For:**
- Map generation (islands work at fine-grid resolution)
- Combat mechanics (ranges calculated from ship centers)
- Turn management or game flow
- Player controls or UI interaction
