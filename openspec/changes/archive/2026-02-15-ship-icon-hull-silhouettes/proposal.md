## Why

With the grid subdivision change (40×30 grid, 30px tiles), ships now occupy visually distinct footprints — Sloops at 1×1, Frigates at 2×1, Flagships at 2×2. The bold "1/2/3" level numbers overlaid on each ship are now redundant since size alone communicates rank. The current geometric shapes (triangle, pentagon, hexagon) are abstract and don't read as "ships" — replacing them with hull silhouettes improves thematic coherence and visual clarity at the smaller tile size.

## What Changes

- **Remove level number overlay** from all ship types (the `ship.type.toString()` text drawn at ship center)
- **Replace geometric shapes with hull silhouettes** — all three ship types share a pointed-bow/tapered-stern vocabulary, differentiated by proportion and detail:
  - Sloop: compact hull, single mast line
  - Frigate: elongated hull, two mast lines, gun ports
  - Flagship: wide imposing hull, three mast lines, multiple gun port rows, deck detail
- **Add mast lines as subtle rank indicator** — thin vertical lines (1/2/3) near the top of each hull, reinforcing rank without dominating the shape
- **Ghost ships use the same hull silhouettes** — rendered translucent with dashed outline, matching the updated shapes

## Capabilities

### New Capabilities
- `ship-rendering`: Defines how ship types are visually represented on the game grid, including hull shapes, rank indicators, and per-type visual details

### Modified Capabilities
- `ghost-ship-rendering`: Ghost ships must use the updated hull silhouette shapes instead of the previous geometric shapes

## Impact

- `client/src/ui/Renderer.js` — `drawSloop()`, `drawFrigate()`, `drawFlagship()` rewritten with hull silhouette paths; level number drawing removed from `drawShips()`; `drawGhostShip()` inherits new shapes automatically (already delegates to the same draw methods)
- No gameplay logic changes — purely visual
- No constant/config changes needed
