# nearest-tile-adjacency

## ADDED Requirements

### Requirement: Nearest-tile distance between multi-tile ships
The system SHALL calculate the distance between two multi-tile ships as the minimum Manhattan distance between any pair of their occupied tiles.

#### Scenario: Adjacent Frigate and Sloop
- **WHEN** a horizontal Frigate occupies [(10, 5), (11, 5)] and a Sloop occupies [(12, 5)]
- **THEN** the nearest-tile distance SHALL be 1 (from (11, 5) to (12, 5))

#### Scenario: Flagship adjacent to Sloop
- **WHEN** a Flagship occupies [(10, 5), (11, 5), (10, 6), (11, 6)] and a Sloop occupies [(12, 5)]
- **THEN** the nearest-tile distance SHALL be 1 (from (11, 5) to (12, 5))

#### Scenario: Non-adjacent ships
- **WHEN** a Sloop occupies [(5, 5)] and a Frigate occupies [(10, 5), (11, 5)]
- **THEN** the nearest-tile distance SHALL be 5 (from (5, 5) to (10, 5))

### Requirement: Boarding uses nearest-tile adjacency
The system SHALL use nearest-tile distance for boarding eligibility checks. Two ships are boardable when nearest-tile distance equals 1.

#### Scenario: Boarding eligible at nearest-tile distance 1
- **WHEN** a Frigate occupies [(10, 5), (11, 5)] and a Sloop occupies [(10, 6)]
- **THEN** the Frigate SHALL be eligible to board the Sloop (nearest-tile distance = 1, from (10, 5) to (10, 6))

#### Scenario: Boarding ineligible at nearest-tile distance 2
- **WHEN** a Frigate occupies [(10, 5), (11, 5)] and a Sloop occupies [(10, 7)]
- **THEN** the Frigate SHALL NOT be eligible to board the Sloop (nearest-tile distance = 2)

#### Scenario: Flagship boarding uses any edge tile
- **WHEN** a Flagship occupies [(10, 5), (11, 5), (10, 6), (11, 6)] and a Sloop occupies [(12, 6)]
- **THEN** the Flagship SHALL be eligible to board the Sloop (nearest-tile distance = 1, from (11, 6) to (12, 6))

### Requirement: Firing range uses center-to-center distance
The system SHALL use center-to-center Manhattan distance for firing range checks, NOT nearest-tile distance.

#### Scenario: Firing range from Flagship center
- **WHEN** a Flagship at anchor (10, 5) with center (11, 6) fires at a Sloop at (15, 6) with center (15.5, 6.5)
- **THEN** the firing distance SHALL be calculated as Manhattan distance between (11, 6) and (15.5, 6.5) = 4.5 + 0.5 = 5
- **AND** the ship SHALL be in range if 5 ≤ the Flagship's firing range

#### Scenario: Center-based distance differs from nearest-tile
- **WHEN** two ships have nearest-tile distance of 1 but center-to-center distance of 2.5
- **THEN** firing range checks SHALL use the center-to-center distance of 2.5
- **AND** boarding checks SHALL use the nearest-tile distance of 1
