## Context

Shrouded Sails is a vanilla JavaScript game with a modular UI system using separate classes for each modal/panel component. Existing patterns:
- Modal components follow a consistent structure: constructor with dependencies, initialize(), show(), hide()
- All modals share CSS classes and patterns (`.modal`, `.modal-content`, specific class like `.bug-report-modal`)
- Components are instantiated in `main.js` and wired to their trigger elements
- Audio events use optional `audioManager` parameter for menu sounds

The InGameSettingsPanel is accessible during gameplay via a gear button in the header. It currently contains audio controls and a "Report Bug" button that opens BugReportModal.

## Goals / Non-Goals

**Goals:**
- Create a simple, non-interactive AboutModal that displays static information
- Match existing modal patterns for consistency (BugReportModal is a good reference)
- Keep content game-like (not web-page-like) - match the splash screen's aesthetic
- Display: game version, creator credits, AI disclosure, GitHub link
- Make modal accessible from InGameSettingsPanel (next to Report Bug button)

**Non-Goals:**
- Dynamic content fetching (no GitHub API for contributor lists)
- Complex animations or interactions beyond standard modal open/close
- Pre-game access to About (in-game only is sufficient)
- Linking to every AGENTS.md detail (just a mention with link)

## Decisions

### Decision 1: AboutModal follows BugReportModal pattern
**Rationale:** BugReportModal is the most recent modal implementation and provides a clean, minimal pattern. Copying its structure ensures consistency.

**Alternatives considered:**
- SettingsMenu pattern: Too complex, includes form state management we don't need
- SplashScreen pattern: Full-screen overlay, not appropriate for in-game use

### Decision 2: Static content in HTML, not JS-generated
**Rationale:** About content doesn't change per session and doesn't depend on game state. Hardcoding in HTML keeps the JS class simple and matches how BugReportModal structures its content.

**Alternatives considered:**
- Build content in JS constructor: More flexible but unnecessary complexity
- Fetch from external file: Overkill for static content

### Decision 3: Version pulled from package.json not displayed
**Rationale:** Package.json lives one level up from client, and there's no build-time injection configured. Hardcoding "v1.0.0" or omitting version is simpler than setting up version injection.

**Alternatives considered:**
- Add version injection to Vite config: Too much infrastructure for one number
- Display commit hash: Not user-friendly

### Decision 4: Modal uses Cinzel font to match splash aesthetic
**Rationale:** The splash screen uses ornamental typography with Cinzel. AboutModal should feel like the splash screen's "information cousin" - formal, game-like, thematic.

**Alternatives considered:**
- Use default body font: Would feel like a settings form, not a game element
- Create entirely new style: Inconsistent with existing game aesthetics

## Risks / Trade-offs

**Risk:** Hardcoded creator name means contributors aren't automatically credited
**Mitigation:** This is intentional per user preference. Future growth can add dynamic credits if needed.

**Risk:** In-game only access means players might not discover About before reporting bugs
**Mitigation:** Report Bug flow captures context automatically, so About is informational not functional.

**Trade-off:** Static HTML content is less flexible but simpler to maintain
**Acceptance:** Content changes infrequently enough that editing HTML is acceptable.
