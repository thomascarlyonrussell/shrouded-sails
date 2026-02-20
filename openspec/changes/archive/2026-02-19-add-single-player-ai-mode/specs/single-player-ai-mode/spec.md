## ADDED Requirements

### Requirement: Single-player control assignment
The system SHALL support a single-player mode where Player 1 is human-controlled and Player 2 is AI-controlled.

#### Scenario: Match starts in single-player mode
- **WHEN** the player starts a match with game mode set to `single_player`
- **THEN** Player 1 SHALL be controlled by human input
- **AND** Player 2 SHALL be controlled by the AI controller

#### Scenario: Human side is fixed in baseline mode
- **WHEN** a single-player match is active
- **THEN** the system SHALL NOT provide runtime control reassignment between Player 1 and Player 2

### Requirement: AI turn automation
The system SHALL automatically execute Player 2 turns in single-player mode without manual activation.

#### Scenario: AI turn starts automatically
- **WHEN** turn control switches to Player 2 in a single-player match
- **THEN** the AI controller SHALL start turn actions automatically
- **AND** the human player SHALL NOT need to press end-turn or start-turn controls for Player 2

#### Scenario: AI ends turn safely when no actions are available
- **WHEN** Player 2 has no legal actions remaining or cannot produce a legal action
- **THEN** the AI controller SHALL end the turn automatically

### Requirement: Single-player transition flow
The system SHALL skip pass-device transition prompts in single-player mode.

#### Scenario: No handoff modal on player switch
- **WHEN** turn control changes between Player 1 and Player 2 in single-player mode
- **THEN** the pass-device turn transition modal SHALL NOT be shown

### Requirement: AI rule parity and fog fairness
The AI controller SHALL obey the same action legality rules as human players and SHALL NOT use hidden enemy state under fog.

#### Scenario: AI action uses existing legality checks
- **WHEN** the AI selects movement, attack, or boarding actions
- **THEN** each action SHALL be validated by existing gameplay rules for range, movement, occupancy, and action availability

#### Scenario: AI targeting under fog of war
- **WHEN** fog of war is enabled and enemy ships are outside AI vision
- **THEN** the AI SHALL NOT target those hidden enemy ships directly
- **AND** the AI MAY use last-known enemy positions that are available through existing ghost-ship data

### Requirement: Cinematic AI pacing
AI turns SHALL execute with cinematic pacing instead of instant resolution.

#### Scenario: Action delays are visible
- **WHEN** the AI performs multiple actions during its turn
- **THEN** the system SHALL apply non-zero delays between successive visible actions
- **AND** movement and combat feedback SHALL remain readable to the player

#### Scenario: Human input is gated during AI action execution
- **WHEN** the AI is actively executing turn actions
- **THEN** human action input paths SHALL be ignored or disabled until AI execution completes

### Requirement: Hotseat mode remains unchanged
Existing hotseat gameplay flow SHALL continue unchanged when game mode is `hotseat`.

#### Scenario: Hotseat retains manual turn handoff
- **WHEN** a match is started in `hotseat` mode
- **THEN** turn transition behavior SHALL remain manual with existing handoff flow
- **AND** no AI controller turn execution SHALL occur
