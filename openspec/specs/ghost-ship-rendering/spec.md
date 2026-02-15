# ghost-ship-rendering

## Purpose
Renders visual representations of enemy ships at their last-known positions when they are outside friendly vision range.

## Requirements

### Requirement: Ghost ship visual representation
The system SHALL render enemy ships at their last-known positions as ghost ships with distinct visual styling.

#### Scenario: Ghost ship rendered at last-known position
- **WHEN** an enemy ship moves out of all friendly vision range
- **THEN** a ghost ship SHALL be rendered at the last observed position
- **AND** the ghost ship SHALL have reduced opacity (translucent/dimmed appearance)

#### Scenario: Ghost ship shows ship type
- **WHEN** a ghost ship is rendered
- **THEN** the ship type (Sloop, Frigate, Flagship) SHALL be displayed using the same shape as the actual ship
- **AND** the color SHALL indicate the enemy player (Red or Blue)

#### Scenario: Ghost ship hides current status information
- **WHEN** a ghost ship is rendered
- **THEN** the current HP bar SHALL NOT be displayed
- **AND** action indicators (M/A badges, DONE overlay) SHALL NOT be displayed
- **AND** only the ship type and last-known position SHALL be shown

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

#### Scenario: Ghost ship does not block movement
- **WHEN** calculating valid movement positions for a friendly ship
- **THEN** ghost ship positions SHALL NOT be treated as occupied tiles
- **AND** friendly ships MAY move through or onto ghost ship positions
