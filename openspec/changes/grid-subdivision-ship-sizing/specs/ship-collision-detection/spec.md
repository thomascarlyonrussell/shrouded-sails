# ship-collision-detection

## ADDED Requirements

### Requirement: Multi-tile boundary validation
The system SHALL validate that all tiles occupied by a ship's footprint are within the map boundaries.

#### Scenario: Frigate placement near right edge
- **WHEN** placing a horizontal Frigate at anchor (39, 10) on a 40×30 grid
- **THEN** the placement SHALL be rejected because tile (40, 10) is outside the boundary

#### Scenario: Flagship placement near bottom-right corner
- **WHEN** placing a Flagship at anchor (38, 28) on a 40×30 grid
- **THEN** the placement SHALL be rejected because tiles (38, 29) and (39, 29) would extend to row 29 but (39, 29) and the 2×2 block requires valid positions at (38,28), (39,28), (38,29), (39,29) — all within bounds
- **AND** anchor (39, 29) would be rejected because (40, 29), (39, 30), and (40, 30) are outside the boundary

#### Scenario: Valid multi-tile placement
- **WHEN** placing a Flagship at anchor (20, 15) on a 40×30 grid
- **THEN** the placement SHALL be accepted because all tiles [(20,15), (21,15), (20,16), (21,16)] are within bounds

### Requirement: Multi-tile island collision
The system SHALL check all tiles in a ship's footprint for island collisions during movement.

#### Scenario: Frigate blocked by island on second tile
- **WHEN** a horizontal Frigate attempts to move to anchor (10, 5) and tile (11, 5) is an island
- **THEN** the move SHALL be blocked even though (10, 5) is water

#### Scenario: Flagship blocked by island on any tile
- **WHEN** a Flagship attempts to move to anchor (10, 5) and tile (11, 6) is an island
- **THEN** the move SHALL be blocked even though tiles (10, 5), (11, 5), and (10, 6) are water

#### Scenario: All tiles clear allows movement
- **WHEN** a Flagship attempts to move to anchor (10, 5) and all tiles [(10,5), (11,5), (10,6), (11,6)] are water
- **THEN** the move SHALL be allowed (pending other checks)

### Requirement: Multi-tile ship-to-ship collision
The system SHALL prevent ships from occupying overlapping tiles.

#### Scenario: Frigate cannot overlap with Sloop
- **WHEN** a horizontal Frigate attempts to move to anchor (10, 5) and a Sloop occupies (11, 5)
- **THEN** the move SHALL be blocked due to tile overlap

#### Scenario: Two Flagships cannot overlap
- **WHEN** a Flagship attempts to move to anchor (10, 5) and another Flagship occupies anchor (11, 6)
- **THEN** the move SHALL be blocked because tile (11, 6) would be occupied by both ships

#### Scenario: Ships may be adjacent without collision
- **WHEN** a horizontal Frigate occupies [(10, 5), (11, 5)] and a Sloop occupies (12, 5)
- **THEN** no collision SHALL be detected because no tiles overlap

### Requirement: Multi-tile BFS pathfinding
The system SHALL validate all tiles of a ship's footprint at each candidate position during BFS movement calculation.

#### Scenario: BFS excludes positions where any tile is blocked
- **WHEN** calculating valid move positions for a Flagship
- **THEN** each candidate anchor position SHALL only be included if ALL four tiles of the 2×2 footprint are valid (within bounds, water, not occupied by another ship)

#### Scenario: BFS respects Frigate orientation changes
- **WHEN** calculating valid move positions for a Frigate that would change orientation at a candidate position
- **THEN** the new orientation's footprint SHALL be validated against the grid at that position

### Requirement: Multi-tile placement in starting zones
The system SHALL validate that all tiles of a ship's footprint fall within the starting zone during fleet initialization.

#### Scenario: Flagship placement requires full footprint in zone
- **WHEN** placing a Flagship during fleet initialization
- **THEN** all four tiles of the 2×2 footprint SHALL be within the starting zone
- **AND** all four tiles SHALL be water (not island)
- **AND** no tile SHALL overlap with an already-placed ship

#### Scenario: Frigate placement in starting zone
- **WHEN** placing a Frigate during fleet initialization with default horizontal orientation
- **THEN** both tiles of the 2×1 footprint SHALL be within the starting zone
- **AND** both tiles SHALL be water and unoccupied
