# ghost-ship-rendering

## MODIFIED Requirements

### Requirement: Ghost ship visual representation (MODIFIED)
The system SHALL render ghost ships at their full multi-tile footprint matching the ship's actual class, not as a single tile.

#### Scenario: Ghost Frigate rendered at full footprint
- **WHEN** a Frigate ghost ship is rendered at its last-known position
- **THEN** the ghost SHALL be drawn spanning two tiles matching the Frigate's footprint (2×1)
- **AND** the ghost SHALL use the ship's last-known orientation (horizontal or vertical)
- **AND** the ghost SHALL have reduced opacity (translucent/dimmed appearance)

#### Scenario: Ghost Flagship rendered at full footprint
- **WHEN** a Flagship ghost ship is rendered at its last-known position
- **THEN** the ghost SHALL be drawn spanning four tiles matching the Flagship's 2×2 footprint
- **AND** the ghost SHALL have reduced opacity (translucent/dimmed appearance)

#### Scenario: Ghost Sloop rendered as single tile (unchanged)
- **WHEN** a Sloop ghost ship is rendered at its last-known position
- **THEN** the ghost SHALL be drawn within a single tile (no change from current behavior)

### Requirement: Ghost ship stores footprint data (ADDED)
The system SHALL store the full footprint information (anchor position, orientation) when recording a ghost ship's last-known state.

#### Scenario: Ghost ship records orientation
- **WHEN** a Frigate moves out of vision range
- **THEN** the ghost ship data SHALL include the Frigate's last-known orientation (horizontal or vertical)
- **AND** the ghost SHALL be rendered with that orientation at the last-known anchor position

#### Scenario: Ghost ship records anchor position
- **WHEN** a multi-tile ship moves out of vision range
- **THEN** the ghost ship data SHALL record the ship's anchor position (top-left tile)
- **AND** the ghost footprint SHALL be reconstructed from anchor + ship type + orientation

### Requirement: Ghost ship does not block multi-tile movement (MODIFIED)
Ghost ship positions SHALL not be treated as occupied for multi-tile collision checks.

#### Scenario: Multi-tile ship moves through ghost footprint
- **WHEN** a Flagship calculates valid movement positions
- **THEN** positions overlapping with ghost ship footprint tiles SHALL NOT be blocked
- **AND** the Flagship MAY move through or onto ghost ship positions
