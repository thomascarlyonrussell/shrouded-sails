## MODIFIED Requirements

### Requirement: Ghost ship visual representation
The system SHALL render enemy ships at their last-known positions as ghost ships with distinct visual styling.

#### Scenario: Ghost ship rendered at last-known position
- **WHEN** an enemy ship moves out of all friendly vision range
- **THEN** a ghost ship SHALL be rendered at the last observed position
- **AND** the ghost ship SHALL have reduced opacity (translucent/dimmed appearance)

#### Scenario: Ghost ship shows ship type
- **WHEN** a ghost ship is rendered
- **THEN** the ship type (Sloop, Frigate, Flagship) SHALL be displayed using the same hull silhouette shape as the actual ship
- **AND** the hull silhouette SHALL include mast lines matching the ship type (1 for Sloop, 2 for Frigate, 3 for Flagship)
- **AND** the color SHALL indicate the enemy player (Red or Blue)

#### Scenario: Ghost ship hides current status information
- **WHEN** a ghost ship is rendered
- **THEN** the current HP bar SHALL NOT be displayed
- **AND** action indicators (M/A badges, DONE overlay) SHALL NOT be displayed
- **AND** only the ship type and last-known position SHALL be shown
