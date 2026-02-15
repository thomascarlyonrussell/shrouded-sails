# multi-tile-ships

## ADDED Requirements

### Requirement: Ship footprint definitions
The system SHALL assign a grid footprint to each ship type based on its size class.

#### Scenario: Sloop footprint
- **WHEN** querying the footprint of a Sloop (type 1)
- **THEN** the footprint SHALL be 1×1 (single grid cell)

#### Scenario: Frigate footprint
- **WHEN** querying the footprint of a Frigate (type 2)
- **THEN** the footprint SHALL be 2×1 (two grid cells in a line)
- **AND** the orientation (horizontal or vertical) SHALL determine the cell arrangement

#### Scenario: Flagship footprint
- **WHEN** querying the footprint of a Flagship (type 3)
- **THEN** the footprint SHALL be 2×2 (four grid cells in a block)

### Requirement: Ship anchor position
The system SHALL use the top-left tile of a ship's footprint as its anchor position (`ship.x`, `ship.y`).

#### Scenario: Occupied tiles expand from anchor
- **WHEN** a Frigate is at anchor position (10, 5) with horizontal orientation
- **THEN** `getOccupiedTiles()` SHALL return [(10, 5), (11, 5)]

#### Scenario: Flagship occupied tiles
- **WHEN** a Flagship is at anchor position (10, 5)
- **THEN** `getOccupiedTiles()` SHALL return [(10, 5), (11, 5), (10, 6), (11, 6)]

#### Scenario: Sloop occupied tiles
- **WHEN** a Sloop is at anchor position (10, 5)
- **THEN** `getOccupiedTiles()` SHALL return [(10, 5)]

### Requirement: Ship center point calculation
The system SHALL calculate a ship's center point as the geometric center of all occupied tile centers, used for firing range, vision, and line-of-sight.

#### Scenario: Sloop center
- **WHEN** calculating the center of a Sloop at (10, 5)
- **THEN** the center SHALL be (10.5, 5.5)

#### Scenario: Frigate center (horizontal)
- **WHEN** calculating the center of a horizontal Frigate at anchor (10, 5)
- **THEN** the center SHALL be (11, 5.5) — average of tile centers (10.5, 5.5) and (11.5, 5.5)

#### Scenario: Flagship center
- **WHEN** calculating the center of a Flagship at anchor (10, 5)
- **THEN** the center SHALL be (11, 6) — average of tile centers (10.5, 5.5), (11.5, 5.5), (10.5, 6.5), (11.5, 6.5)

### Requirement: Frigate orientation tracking
The system SHALL track Frigate orientation (horizontal or vertical) and update it based on movement direction.

#### Scenario: Orientation set by horizontal movement
- **WHEN** a Frigate moves with |dx| > |dy|
- **THEN** the orientation SHALL be set to horizontal
- **AND** the footprint SHALL be 2×1 (two cells side by side)

#### Scenario: Orientation set by vertical movement
- **WHEN** a Frigate moves with |dy| > |dx|
- **THEN** the orientation SHALL be set to vertical
- **AND** the footprint SHALL be 1×2 (two cells stacked)

#### Scenario: Orientation preserved on equal deltas
- **WHEN** a Frigate moves with |dx| = |dy| (diagonal movement)
- **THEN** the orientation SHALL remain unchanged from its previous value

#### Scenario: Default orientation
- **WHEN** a Frigate is first placed on the board
- **THEN** the default orientation SHALL be horizontal

### Requirement: Sloops and Flagships do not track orientation
The system SHALL NOT track or change orientation for Sloops (symmetric 1×1) or Flagships (symmetric 2×2).

#### Scenario: Sloop has no orientation
- **WHEN** a Sloop moves in any direction
- **THEN** no orientation property SHALL be updated
- **AND** the 1×1 footprint SHALL remain the same regardless of movement direction

#### Scenario: Flagship has no orientation
- **WHEN** a Flagship moves in any direction
- **THEN** no orientation property SHALL be updated
- **AND** the 2×2 footprint SHALL remain the same regardless of movement direction
