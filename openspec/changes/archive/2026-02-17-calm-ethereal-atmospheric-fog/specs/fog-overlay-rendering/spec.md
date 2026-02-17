## MODIFIED Requirements

### Requirement: Fog overlay on out-of-vision areas
The system SHALL render a multi-density translucent fog overlay on map areas outside friendly fleet vision range.

#### Scenario: Fog rendered on unseen water tiles
- **WHEN** a water tile is outside the vision range of all friendly ships
- **THEN** a fog overlay SHALL be rendered over that tile

#### Scenario: Fog density increases with unseen depth
- **WHEN** multiple unseen water tiles are rendered at different distances from the visible frontier
- **THEN** tiles closer to the visibility boundary SHALL use lighter fog density
- **AND** deep-unseen tiles SHALL use denser fog density

#### Scenario: Fog not rendered on tiles in vision
- **WHEN** a water tile is within vision range of at least one friendly ship
- **THEN** NO fog overlay SHALL be rendered on that tile
- **AND** the tile SHALL be clearly visible

#### Scenario: Fog overlay updates with ship movement
- **WHEN** a friendly ship moves to a new position
- **THEN** fog coverage and fog density zones SHALL be recalculated and updated
- **AND** newly visible tiles SHALL have fog removed
- **AND** tiles that moved out of vision SHALL have fog added

### Requirement: Fog visual styling
The system SHALL render fog with calm, ethereal styling that indicates uncertainty while maintaining map readability.

#### Scenario: Fog contrast with water tiles
- **WHEN** fog is rendered over water tiles
- **THEN** fog SHALL use dark translucent styling that preserves some underlying water color
- **AND** fog opacity SHALL remain below full opacity

#### Scenario: Fog boundary transitions are softened
- **WHEN** visible and unseen tiles share a border
- **THEN** the fog transition near that boundary SHALL use softened or feathered visual treatment
- **AND** the boundary SHALL remain legible for tactical interpretation

#### Scenario: Fog does not obscure grid lines
- **WHEN** fog is rendered over map tiles
- **THEN** grid lines SHALL remain visible through fog
- **AND** tile boundaries SHALL be clearly distinguishable

#### Scenario: Fog animation remains subtle
- **WHEN** fog animation is present
- **THEN** motion SHALL remain slow and non-distracting
- **AND** fog animation SHALL support a calm, ethereal mood rather than a storm effect

### Requirement: Fog rendering performance
The system SHALL render fog overlays efficiently without impacting game performance.

#### Scenario: Visibility-derived fog data updates on state change
- **WHEN** visibility state changes due to turn, movement, or ownership context
- **THEN** fog coverage data SHALL be recomputed for the new state
- **AND** cached fog data from prior states SHALL NOT be reused incorrectly

#### Scenario: Fog animation avoids redundant full recomputation
- **WHEN** only animation time advances and visibility state is unchanged
- **THEN** fog animation SHALL reuse existing visibility-derived fog coverage data
- **AND** full visibility recomputation SHALL be avoided

#### Scenario: Fog rendering maintains smooth frame rates
- **WHEN** fog and atmosphere are rendered during gameplay
- **THEN** rendering SHALL maintain smooth frame rates (≥30 FPS)
