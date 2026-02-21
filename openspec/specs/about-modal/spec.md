# about-modal Specification

## Purpose
TBD - created by archiving change add-about-modal. Update Purpose after archive.
## Requirements
### Requirement: AboutModal displays game information
The AboutModal SHALL display static information about the game including a title, tagline, and brief description.

#### Scenario: Modal displays game information
- **WHEN** user opens the AboutModal
- **THEN** the modal displays "About Shrouded Sails" as the title
- **AND** the modal displays a brief game description

### Requirement: AboutModal displays creator credits
The AboutModal SHALL display creator and contributor information.

#### Scenario: Creator information is shown
- **WHEN** user opens the AboutModal
- **THEN** the modal displays a "Created By" section with creator name/handle
- **AND** includes a link to the creator's GitHub profile

### Requirement: AboutModal displays AI assistance disclosure
The AboutModal SHALL disclose that the game was developed with AI assistance without making it the primary focus.

#### Scenario: AI disclosure is present
- **WHEN** user opens the AboutModal
- **THEN** the modal includes a section mentioning AI assistance
- **AND** lists the AI tools used (GitHub Copilot, Claude, OpenAI Codex)
- **AND** includes a brief statement that code is human-reviewed
- **BUT** the disclosure is one section among others, not the headline

### Requirement: AboutModal provides external links
The AboutModal SHALL provide links to external resources about the project.

#### Scenario: GitHub link is available
- **WHEN** user opens the AboutModal
- **THEN** the modal includes a link to view source on GitHub
- **AND** the link opens in a new tab/window

#### Scenario: Documentation link is available
- **WHEN** user opens the AboutModal
- **THEN** the modal includes a link to project documentation
- **AND** the link opens in a new tab/window

### Requirement: AboutModal is accessible from in-game settings
The AboutModal SHALL be accessible via a button in the InGameSettingsPanel.

#### Scenario: About button opens modal
- **WHEN** user clicks the "About This Game" button in InGameSettingsPanel
- **THEN** the AboutModal opens
- **AND** the InGameSettingsPanel remains open in the background

#### Scenario: About button is positioned near Report Bug
- **WHEN** user views the InGameSettingsPanel
- **THEN** the "About This Game" button is visible
- **AND** it is positioned near the "Report Feedback/Bug" button

### Requirement: AboutModal follows game aesthetic
The AboutModal SHALL match the visual style of the splash screen and other game modals.

#### Scenario: Modal uses game typography
- **WHEN** user opens the AboutModal
- **THEN** the modal uses the Cinzel font family for headings
- **AND** matches the ornamental style of the splash screen

#### Scenario: Modal uses consistent styling
- **WHEN** user opens the AboutModal
- **THEN** the modal uses the `.modal` and `.modal-content` CSS classes
- **AND** includes a specific `.about-modal` class for custom styling

### Requirement: AboutModal supports standard modal interactions
The AboutModal SHALL support standard open, close, and keyboard interactions like other modals.

#### Scenario: Modal can be closed with close button
- **WHEN** user clicks the close/dismiss button
- **THEN** the modal closes
- **AND** control returns to the game

#### Scenario: Modal plays audio on open/close
- **WHEN** user opens the AboutModal
- **THEN** the menu_open sound plays (if audio enabled)
- **AND** when closed, the menu_close sound plays (if audio enabled)

#### Scenario: Modal supports keyboard close
- **WHEN** AboutModal is open and user presses Escape key
- **THEN** the modal closes immediately

