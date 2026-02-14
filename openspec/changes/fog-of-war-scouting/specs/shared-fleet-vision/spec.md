## ADDED Requirements

### Requirement: Combined vision from all friendly ships
The system SHALL pool vision coverage from all friendly ships to create a combined vision area for the player's fleet.

#### Scenario: Multiple ships provide overlapping vision
- **WHEN** two friendly ships have overlapping vision ranges
- **THEN** the entire combined area SHALL be visible to the player
- **AND** enemy ships in the overlapping area SHALL be visible

#### Scenario: Ships provide separate vision areas
- **WHEN** two friendly ships have non-overlapping vision ranges
- **THEN** both separate vision areas SHALL be visible to the player
- **AND** enemy ships in either area SHALL be visible

#### Scenario: Enemy visible to any friendly ship is visible to player
- **WHEN** an enemy ship is within vision range of any friendly ship
- **AND** line of sight is not blocked by islands
- **THEN** the enemy ship SHALL be visible to the player regardless of which friendly ship can see it

### Requirement: Vision updates when ships move
The system SHALL recalculate combined fleet vision whenever any ship moves.

#### Scenario: Friendly ship moves to reveal new area
- **WHEN** a friendly ship moves to a new position
- **THEN** the vision coverage SHALL be recalculated
- **AND** newly visible enemy ships SHALL appear
- **AND** enemy ships that moved out of all friendly vision SHALL become ghost ships

#### Scenario: Enemy ship moves while one friendly can see
- **WHEN** an enemy ship moves while within vision of at least one friendly ship
- **THEN** the enemy ship's position SHALL update in real-time
- **AND** the last-known position SHALL be updated to the new location

### Requirement: Vision persists across individual ship actions
The system SHALL maintain shared vision state independently of which ship is currently selected or active.

#### Scenario: Different ship selected during turn
- **WHEN** a player selects a different friendly ship during their turn
- **THEN** the combined fleet vision SHALL remain unchanged
- **AND** all previously visible enemies SHALL remain visible

#### Scenario: Ship destroyed does not eliminate shared vision
- **WHEN** a friendly ship is destroyed
- **THEN** the vision coverage SHALL be recalculated using remaining friendly ships
- **AND** enemy ships still visible to other friendly ships SHALL remain visible
