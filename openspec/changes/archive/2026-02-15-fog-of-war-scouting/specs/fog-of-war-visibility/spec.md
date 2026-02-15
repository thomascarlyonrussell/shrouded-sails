## ADDED Requirements

### Requirement: Enemy ships hidden outside vision range
The system SHALL hide enemy ships that are not within vision range of any friendly ship.

#### Scenario: Enemy ship outside vision range
- **WHEN** an enemy ship is positioned outside the vision range of all friendly ships
- **THEN** the enemy ship SHALL NOT be rendered on the game map

#### Scenario: Enemy ship enters vision range
- **WHEN** an enemy ship moves into or a friendly ship moves to bring an enemy within vision range
- **THEN** the enemy ship SHALL become visible and rendered on the game map

#### Scenario: Enemy ship leaves vision range
- **WHEN** an enemy ship that was visible moves out of vision range of all friendly ships
- **THEN** the enemy ship SHALL be hidden and replaced with a ghost ship at its last known position

### Requirement: Last-known position tracking
The system SHALL track and display the last-known position of enemy ships that have been spotted but are no longer in vision range.

#### Scenario: First sighting of enemy ship
- **WHEN** an enemy ship enters vision range for the first time
- **THEN** the system SHALL record the ship's position as its last-known position

#### Scenario: Enemy ship moves while visible
- **WHEN** an enemy ship moves while within vision range
- **THEN** the system SHALL update the last-known position to the new location

#### Scenario: Enemy ship moves while not visible
- **WHEN** an enemy ship moves while outside vision range
- **THEN** the last-known position SHALL remain unchanged at the previous observed location

#### Scenario: Enemy ship re-spotted at different location
- **WHEN** an enemy ship is re-spotted at a different position than its last-known location
- **THEN** the ghost ship SHALL disappear and the actual ship SHALL be rendered at the new position
- **AND** the last-known position SHALL be updated to the new location

### Requirement: Island line-of-sight blocking for vision
The system SHALL apply line-of-sight rules to vision detection, blocking vision through islands.

#### Scenario: Island blocks vision to enemy ship
- **WHEN** a friendly ship is within vision range of an enemy ship
- **AND** an island blocks the direct line of sight between them
- **THEN** the enemy ship SHALL NOT be visible to the friendly ship

#### Scenario: Multiple friendly ships with different line of sight
- **WHEN** one friendly ship has line of sight to an enemy while another does not
- **THEN** the enemy ship SHALL be visible because at least one friendly ship can see it
