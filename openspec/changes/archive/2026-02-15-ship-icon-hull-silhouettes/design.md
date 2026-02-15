## Context

The Renderer draws ships using three dedicated methods — `drawSloop()`, `drawFrigate()`, `drawFlagship()` — called from `drawShips()`, which translates to each ship's center point before drawing. Each method receives `shipColor`, `shipWidth`, and `shipHeight` and draws in local coordinates around origin (0,0). After shape drawing, `drawShips()` overlays a bold "1/2/3" level number at center, plus optional flagship gold dot, HP bar, action indicators, and done overlay.

Ghost ships in `drawGhostShip()` delegate to the same three draw methods with a translucent color, then add a dashed stroke. They do NOT draw numbers, HP bars, or action indicators.

**Current shapes and pixel budgets:**
- Sloop: triangle in ~18×19px (0.6 × 30, 0.8 × 30) — very tight
- Frigate horizontal: pentagon in ~49×20px (0.82 × 60, 0.68 × 30) — decent width, cramped height
- Frigate vertical: pentagon in ~25×41px (0.82 × 30, 0.68 × 60) — narrow but tall
- Flagship: hexagon in ~36×53px (0.6 × 60, 0.8 × 60 × 1.1) — ample space

**Constraint:** All drawing uses Canvas 2D context path operations (`moveTo`, `lineTo`, `arc`, `bezierCurveTo`, `quadraticCurveTo`). No images or sprites.

## Goals / Non-Goals

**Goals:**
- Replace geometric shapes (triangle, pentagon, hexagon) with hull silhouettes using a shared ship vocabulary (pointed bow, curved hull, tapered stern)
- Remove level number overlay from all ships
- Add mast lines (1/2/3) as a subtle rank indicator
- Maintain the existing draw method signature so `drawShips()` and `drawGhostShip()` callers need minimal changes
- Keep gun ports and deck detail where pixel budget allows

**Non-Goals:**
- Changing ship footprints, sizes, or game balance
- Adding ship rotation/facing visuals (the commented-out `ctx.rotate` stays commented out)
- Modifying overlay chrome (HP bar, action indicators, DONE overlay, captured badge)
- Adding sprite/image assets — staying with canvas path drawing
- Changing the flagship gold dot indicator (stays as-is)

## Decisions

### Decision 1: Shared hull silhouette vocabulary using quadratic curves

**Choice:** All three ship types use the same structural approach — a pointed bow, curved hull sides (quadratic Bezier curves), and a tapered/flat stern. Differentiated by proportion, detail density, and mast count.

**Rationale:**
- Curved hulls read as "ship" at every scale, unlike angular geometric shapes
- `quadraticCurveTo` is well-supported and adds one control point per curve — minimal complexity
- Using a consistent vocabulary across all three types creates visual family cohesion while size differences handle rank distinction

**Alternative considered:** Keep angular paths, just reshape them
- Rejected: Angular paths at 30px still read as abstract shapes, not ships. The whole point is to improve thematic coherence.

### Decision 2: Mast lines as rank indicator, not numbers

**Choice:** Draw thin vertical lines near the top of the hull — 1 for Sloop, 2 for Frigate, 3 for Flagship. Lines are ~1px wide, white with black outline, extending from a small horizontal yard/crossbar.

**Rationale:**
- Numbers are blunt and compete with hull detail at small sizes. The bold "20px Arial" text dominated the Sloop's entire 18×19px shape area.
- Mast lines are thematic (ships are identified by mast count in naval contexts) and take minimal pixel space
- At the 30px Sloop scale, a single mast line is visible without cluttering. At Flagship scale, three masts add visual weight that reinforces the ship's imposing size.

**Alternative considered:** No rank indicator at all (size only)
- Viable but rejected: When ships are on opposite sides of the map and you can't directly compare sizes, mast count gives an at-a-glance read without requiring spatial comparison.

### Decision 3: Draw method signatures stay the same

**Choice:** Keep `drawSloop(shipColor, shipWidth, shipHeight)`, `drawFrigate(shipColor, shipWidth, shipHeight, orientation)`, and `drawFlagship(shipColor, shipWidth, shipHeight)`. Each method handles its own hull path, deck detail, gun ports, and mast lines internally.

**Rationale:**
- `drawShips()` and `drawGhostShip()` already call these with computed dimensions — no caller changes needed
- Masts are drawn inside each method, replacing the external number overlay that was drawn in `drawShips()` after the shape call
- Ghost ships automatically get the new shapes since they delegate to the same methods

### Decision 4: Remove level number block from drawShips()

**Choice:** Delete the 8-line block in `drawShips()` (lines 379-387) that draws `ship.type.toString()` at center. No replacement at that call site — masts are drawn inside each shape method.

**Rationale:**
- This is the entire reason for the change. The number overlay is redundant with size + masts.
- Moving rank indication into each draw method is cleaner — each method is self-contained.

### Decision 5: Hull proportions per ship type

**Choice:** Specific proportion guidelines for each type:

**Sloop (18×19px budget):**
- Narrow pointed bow (sharp angle)
- Gentle hull curves — subtle since pixel budget is tight
- Flat stern
- Single mast at ~30% from bow
- No gun ports (too small, and Sloop has 1 cannon which doesn't need visual emphasis)

**Frigate (49×20px horizontal, 25×41px vertical):**
- Pronounced pointed bow
- Wider hull with visible curve
- Slightly tapered stern
- Two masts evenly spaced
- Single row of gun ports (2 per side)

**Flagship (36×53px budget):**
- Bold pointed bow
- Wide hull with strong curves
- Tapered stern point (matching bow for symmetry)
- Three masts
- Two rows of gun ports (2 per side per row)
- Deck detail layers (main + upper deck, as currently exists)

**Rationale:**
- Proportions are calibrated to available pixel budgets. The Sloop keeps it minimal because 18×19px leaves no room for detail. The Flagship has space for layered detail.
- Gun ports scale with cannon count (Sloop=1 so none shown, Frigate=2 so one row, Flagship=4 so two rows).

## Risks / Trade-offs

### [Risk] Sloop hull may look blobby at 18×19px
Quadratic curves need enough pixel space to resolve cleanly. At 18px wide, a curve might render as a jagged blob.
**Mitigation:** Keep Sloop curves very subtle — nearly straight lines with slight outward bulge. Test at 1× zoom. If curves don't resolve cleanly, fall back to straight angled lines that approximate a hull shape (still better than a plain triangle).

### [Risk] Mast lines invisible at low zoom
At minimum zoom (full board visible), 30px tiles shrink significantly. A 1px mast line might vanish.
**Mitigation:** Masts are a secondary indicator — size is primary. At low zoom, you're seeing fleet-level positioning where exact rank matters less. At zoom levels where tactical decisions happen, masts will be visible.

### [Risk] Ghost ship appearance changes
Ghost ships delegate to the same draw methods, so they automatically get hull silhouettes. The dashed stroke applied after may interact differently with curved paths vs angular paths.
**Mitigation:** Dashed strokes on canvas curves work fine — the dash pattern follows the path. No special handling needed. Verify visually during implementation.

## Open Questions

None — this is a contained visual change with clear scope.
