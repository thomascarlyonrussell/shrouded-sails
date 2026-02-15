# ghost-ship-rendering

## Purpose
Renders visual representations of enemy ships at their last-known positions when they are outside friendly vision range.

## Requirements

### Requirement: Ghost ship visual representation
The system SHALL render ghost ships at their full multi-tile footprint matching the ship's actual class, not as a single tile.

#### Scenario: Ghost Frigate rendered at full footprint
- **WHEN** a Frigate ghost ship is rendered at its last-known position
- **THEN** the ghost SHALL be drawn spanning two tiles matching the Frigate's footprint (2×1)
- **AND** the ghost SHALL use the ship's last-known orientation (horizontal or vertical)
- **AND** the ghost ship SHALL have reduced opacity (translucent/dimmed appearance)

#### Scenario: Ghost Flagship rendered at full footprint
- **WHEN** a Flagship ghost ship is rendered at its last-known position
- **THEN** the ghost SHALL be drawn spanning four tiles matching the Flagship's 2×2 footprint
- **AND** the ghost SHALL have reduced opacity (translucent/dimmed appearance)

#### Scenario: Ghost Sloop rendered as single tile
- **WHEN** a Sloop ghost ship is rendered at its last-known position
- **THEN** the ghost SHALL be drawn within a single tile (no change from current behavior)

#### Scenario: Ghost ship hides current status information
- **WHEN** a ghost ship is rendered
- **THEN** the current HP bar SHALL NOT be displayed
- **AND** action indicators (M/A badges, DONE overlay) SHALL NOT be displayed
- **AND** only the ship type and last-known position SHALL be shown

### Requirement: Ghost ship stores footprint data
The system SHALL store the full footprint information (anchor position, orientation) when recording a ghost ship's last-known state.

#### Scenario: Ghost ship records orientation
- **WHEN** a Frigate moves out of vision range
- **THEN** the ghost ship data SHALL include the Frigate's last-known orientation (horizontal or vertical)
- **AND** the ghost SHALL be rendered with that orientation at the last-known anchor position

#### Scenario: Ghost ship records anchor position
- **WHEN** a multi-tile ship moves out of vision range
- **THEN** the ghost ship data SHALL record the ship's anchor position (top-left tile)
- **AND** the ghost footprint SHALL be reconstructed from anchor + ship type + orientation

### Requirement: Ghost ship removal on re-spotting
The system SHALL remove ghost ships when the actual enemy ship is re-spotted at a different location.

#### Scenario: Enemy re-spotted at same location
- **WHEN** an enemy ship is re-spotted at its last-known position
- **THEN** the ghost ship SHALL be replaced with the actual ship rendering
- **AND** current HP and status information SHALL be displayed

#### Scenario: Enemy re-spotted at different location
- **WHEN** an enemy ship is re-spotted at a different position than its last-known location
- **THEN** the ghost ship at the old location SHALL be removed immediately
- **AND** the actual ship SHALL be rendered at the new location

#### Scenario: Enemy destroyed while not in vision
- **WHEN** an enemy ship is destroyed while outside vision range
- **THEN** the ghost ship SHALL remain at the last-known position
- **AND** SHALL only be removed when a friendly ship moves to reveal the area shows no ship there

### Requirement: Ghost ship interaction restrictions
The system SHALL prevent player interaction with ghost ships as if they were actual targets.

#### Scenario: Cannot target ghost ship for attack
- **WHEN** a player attempts to target a ghost ship for cannon fire
- **THEN** the ghost ship SHALL NOT be selectable as an attack target

#### Scenario: Cannot target ghost ship for boarding
- **WHEN** a player attempts to target a ghost ship for boarding
- **THEN** the ghost ship SHALL NOT be selectable as a boarding target

### Requirement: Ghost ship does not block multi-tile movement
Ghost ship positions SHALL not be treated as occupied for multi-tile collision checks.

#### Scenario: Multi-tile ship moves through ghost footprint
- **WHEN** a Flagship calculates valid movement positions
- **THEN** positions overlapping with ghost ship footprint tiles SHALL NOT be blocked
- **AND** the Flagship MAY move through or onto ghost ship positions
