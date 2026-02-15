# fog-overlay-rendering

## Purpose
Renders visual fog overlay on map areas outside friendly fleet vision range while maintaining map readability and performance.

## Requirements

### Requirement: Fog overlay on out-of-vision areas
The system SHALL render a translucent fog overlay on map areas outside friendly fleet vision range.

#### Scenario: Fog rendered on unexplored water tiles
- **WHEN** a water tile is outside the vision range of all friendly ships
- **THEN** a semi-transparent fog overlay SHALL be rendered over that tile

#### Scenario: Fog not rendered on tiles in vision
- **WHEN** a water tile is within vision range of at least one friendly ship
- **THEN** NO fog overlay SHALL be rendered on that tile
- **AND** the tile SHALL be clearly visible

#### Scenario: Fog overlay updates with ship movement
- **WHEN** a friendly ship moves to a new position
- **THEN** the fog overlay SHALL be recalculated and updated
- **AND** newly visible tiles SHALL have fog removed
- **AND** tiles that moved out of vision SHALL have fog added

### Requirement: Islands always visible through fog
The system SHALL render all island tiles clearly regardless of fog of war state.

#### Scenario: Islands in fogged areas remain visible
- **WHEN** an island tile is outside friendly vision range
- **THEN** the island SHALL be rendered normally without fog obscuring it
- **AND** the island SHALL be clearly distinguishable from water tiles

#### Scenario: Islands provide terrain information
- **WHEN** viewing the map with fog of war enabled
- **THEN** all island positions and shapes SHALL be visible to both players
- **AND** islands SHALL provide the same strategic information regardless of vision coverage

### Requirement: Fog visual styling
The system SHALL render fog with semi-transparent styling that clearly indicates unexplored areas while maintaining map readability.

#### Scenario: Fog contrast with water tiles
- **WHEN** fog is rendered over water tiles
- **THEN** the fog SHALL use a dark semi-transparent overlay (e.g., rgba(0, 0, 0, 0.5))
- **AND** the water tile color SHALL still be partially visible beneath the fog

#### Scenario: Fog does not obscure grid lines
- **WHEN** fog is rendered over map tiles
- **THEN** grid lines SHALL remain visible through the fog
- **AND** tile boundaries SHALL be clearly distinguishable

### Requirement: Fog rendering performance
The system SHALL render fog overlays efficiently without impacting game performance.

#### Scenario: Fog updates on every frame
- **WHEN** the game render loop executes each frame
- **THEN** fog overlay SHALL be recalculated based on current ship positions
- **AND** rendering SHALL maintain smooth frame rates (≥30 FPS)
