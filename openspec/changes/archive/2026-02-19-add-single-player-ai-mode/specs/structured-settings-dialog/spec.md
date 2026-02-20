## ADDED Requirements

### Requirement: Game mode option in New Game settings
The settings dialog SHALL include a game mode control in the Game Rules category.

#### Scenario: Game mode choices are available
- **WHEN** the user opens the New Game settings dialog
- **THEN** they SHALL see a game mode setting with options for `Hotseat` and `Single Player`
- **AND** the game mode control SHALL follow the dialog's standardized input styling

### Requirement: Game mode value persistence
The selected game mode SHALL persist using the same settings persistence model as other pre-game options.

#### Scenario: Mode selection is retained across restarts
- **WHEN** the user selects a game mode and starts a game
- **THEN** the chosen mode SHALL be saved and reused as the default selection next time the New Game settings dialog is shown

#### Scenario: Backward-compatible default
- **WHEN** previously stored settings do not contain a game mode field
- **THEN** the system SHALL default the game mode to `Hotseat`
