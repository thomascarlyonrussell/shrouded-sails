## ADDED Requirements

### Requirement: Layered atmospheric board rendering
The system SHALL render layered atmospheric visuals for the battlefield water to create a calm, ethereal seascape without obscuring tactical information.

#### Scenario: Atmospheric layers render on water battlefield
- **WHEN** the battlefield canvas is rendered during gameplay
- **THEN** the renderer SHALL include atmospheric water treatment beyond a flat single-color fill
- **AND** the effect SHALL be visible across the playable board area

#### Scenario: Atmospheric layers avoid island distortion
- **WHEN** atmospheric rendering is applied
- **THEN** island tile silhouettes SHALL remain visually distinguishable from water
- **AND** atmospheric overlays SHALL NOT remove island terrain readability

### Requirement: Wind-linked atmospheric drift
The system SHALL derive atmospheric drift direction and intensity from the active gameplay wind state.

#### Scenario: Wind direction drives mist drift direction
- **WHEN** wind has direction vector (dx, dy)
- **THEN** atmospheric drift SHALL move in the same directional heading on the board

#### Scenario: Wind strength scales atmospheric drift intensity
- **WHEN** wind strength changes between supported gameplay values
- **THEN** atmospheric drift speed and/or opacity SHALL scale with strength
- **AND** calm wind SHALL still permit subtle ambient motion that preserves a calm tone

#### Scenario: Wind transitions remain smooth
- **WHEN** wind direction or strength changes at wind phase boundaries
- **THEN** atmospheric motion SHALL transition smoothly over time
- **AND** the visual state SHALL NOT snap abruptly in a single frame

### Requirement: Tactical readability over atmospheric visuals
The system SHALL preserve gameplay readability while atmospheric visuals are active.

#### Scenario: Ships and tactical highlights remain readable
- **WHEN** atmospheric layers are rendered with ships and tactical overlays
- **THEN** ship silhouettes, selection rings, and action highlights SHALL remain clearly visible

#### Scenario: Grid remains readable under atmosphere
- **WHEN** atmospheric layers are active during gameplay
- **THEN** grid boundaries SHALL remain distinguishable at normal gameplay zoom levels

### Requirement: Atmospheric rendering stability and performance
The system SHALL implement atmospheric visuals without degrading core rendering responsiveness.

#### Scenario: Atmosphere remains stable during zoom and pan
- **WHEN** the player zooms or pans the board
- **THEN** atmospheric rendering SHALL remain visually coherent with board coordinates
- **AND** the effect SHALL NOT visibly detach from map motion

#### Scenario: Atmospheric rendering remains within frame budget
- **WHEN** atmospheric rendering is enabled in normal gameplay
- **THEN** render performance SHALL remain smooth for supported platforms
- **AND** atmospheric passes SHALL use caching or lightweight animation techniques where applicable
