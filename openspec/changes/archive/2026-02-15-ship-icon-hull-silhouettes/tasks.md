## 1. Remove Level Number Overlay

- [x] 1.1 Delete the level number drawing block in `drawShips()` (lines 379-387 in Renderer.js) that renders `ship.type.toString()` at ship center

## 2. Rewrite Sloop Hull

- [x] 2.1 Replace `drawSloop()` body with hull silhouette path: pointed bow, gentle quadratic curves for hull sides, flat stern, inner deck region
- [x] 2.2 Add single mast line (white vertical line with dark outline and small horizontal crossbar) drawn at ~30% from bow

## 3. Rewrite Frigate Hull

- [x] 3.1 Replace `drawFrigate()` body with hull silhouette path: pronounced pointed bow, curved hull sides, slightly tapered stern, inner deck region
- [x] 3.2 Add two evenly-spaced mast lines with crossbars
- [x] 3.3 Add single row of gun ports (one per side)

## 4. Rewrite Flagship Hull

- [x] 4.1 Replace `drawFlagship()` body with hull silhouette path: bold pointed bow, strong curved hull sides, tapered stern point, main deck and upper deck regions
- [x] 4.2 Add three evenly-spaced mast lines with crossbars
- [x] 4.3 Add two rows of gun ports (two per side per row)

## 5. Visual Verification

- [x] 5.1 Verify all three ship types render correctly at default zoom for both player colors
- [x] 5.2 Verify ghost ships render with the new hull silhouettes (translucent + dashed outline)
- [x] 5.3 Verify captured ships render with brightened hull color
- [x] 5.4 Verify Frigate renders correctly in both horizontal and vertical orientations
- [x] 5.5 Verify flagship gold dot indicator still renders above the hull
