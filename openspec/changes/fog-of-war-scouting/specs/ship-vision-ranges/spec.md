## ADDED Requirements

### Requirement: Ship type vision ranges
The system SHALL assign vision ranges to each ship type independent of their attack ranges.

#### Scenario: Sloop vision range
- **WHEN** querying the vision range of a Sloop (type 1)
- **THEN** the system SHALL return a vision range of 4 tiles

#### Scenario: Frigate vision range
- **WHEN** querying the vision range of a Frigate (type 2)
- **THEN** the system SHALL return a vision range of 3 tiles

#### Scenario: Flagship vision range
- **WHEN** querying the vision range of a Flagship (type 3)
- **THEN** the system SHALL return a vision range of 2 tiles

### Requirement: Vision range calculation
The system SHALL calculate which tiles are within vision range of a ship using Manhattan distance.

#### Scenario: Tiles within vision range
- **WHEN** calculating vision coverage for a ship at position (10, 10) with vision range 3
- **THEN** all tiles where Manhattan distance from (10, 10) is ≤ 3 SHALL be considered within vision range

#### Scenario: Vision range does not extend beyond map boundaries
- **WHEN** calculating vision coverage for a ship near the map edge
- **THEN** only tiles within the valid map boundaries SHALL be included in the vision range

### Requirement: Vision range independent of attack range
The system SHALL maintain vision range as a separate property from attack range for each ship.

#### Scenario: Flagship vision vs attack range
- **WHEN** a Flagship (vision range 2, attack range 3) detects targets
- **THEN** the Flagship SHALL see enemies up to 2 tiles away
- **AND** MAY attack enemies up to 3 tiles away if they are visible through other friendly ships' vision

#### Scenario: Sloop vision vs attack range
- **WHEN** a Sloop (vision range 4, attack range 2) detects targets
- **THEN** the Sloop SHALL see enemies up to 4 tiles away
- **AND** MAY only attack enemies up to 2 tiles away even if visible
