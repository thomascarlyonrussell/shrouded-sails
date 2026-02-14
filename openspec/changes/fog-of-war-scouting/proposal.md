## Why

Add tactical depth through imperfect information and scouting mechanics. Currently, both players see all enemy ships at all times, eliminating reconnaissance value and ambush tactics. Fog of war creates meaningful scouting decisions, rewards positioning smaller/faster ships for intelligence gathering, and introduces surprise elements where ship types and damage states are discovered through exploration rather than given freely.

## What Changes

- **Fog of War System**: Enemy ships hidden unless within friendly ship vision range, creating last-known position "ghost ships" when they move out of sight
- **Variable Vision Ranges by Ship Type**: 
  - Sloops (size-1) have vision range 4 (best scouts - fast and far-seeing)
  - Frigates (size-2) have vision range 3 (balanced)
  - Flagships (size-3) have vision range 2 (powerful but blind - need escorts)
- **Shared Fleet Vision**: All friendly ships pool their vision ranges together
- **Last-Known Position Tracking**: Once spotted, enemy ships remain visible as "ghost ships" at their last observed location until re-spotted at a new position
- **Hidden Enemy Information**:
  - Enemy positions hidden in fog (don't appear at all unless in vision range)
  - Enemy HP and action status hidden (ship type visible but damage/actions only shown when in active vision)
- **Line-of-Sight Vision**: Vision uses same LOS rules as attacks - islands block vision
- **Visual Fog Rendering**: Translucent fog overlay on out-of-vision areas + dimmed/ghosted ship icons for last-known positions
- **Game Setting Toggle**: **NEW** - Option to enable/disable fog of war in game setup/settings menu (default: enabled)
- **Remove Blind Fire**: Ships cannot attack targets outside vision range (vision > attack range makes this unnecessary)

## Capabilities

### New Capabilities
- `fog-of-war-visibility`: Enemy ships are only visible when within friendly ship vision range, tracked as last-known positions when they move out of sight
- `ship-vision-ranges`: Each ship type has a vision range independent of attack range (Sloop=4, Frigate=3, Flagship=2)
- `shared-fleet-vision`: All friendly ships share their vision collectively - seeing one ship means seeing from all ships' positions
- `ghost-ship-rendering`: Last-known enemy positions rendered as translucent/dimmed icons with limited information
- `fog-overlay-rendering`: Visual fog overlay on map areas outside friendly vision range
- `fog-of-war-toggle`: Game setting to enable/disable fog of war system for current match

### Modified Capabilities
- `enemy-ship-visibility`: **BREAKING** - Enemy ships no longer always visible; visibility depends on vision range and LOS from friendly ships
- `ship-information-display`: Enemy HP bars and action indicators only shown when ship is in active vision range (not for ghost ships)
- `attack-targeting`: Ships cannot target enemies outside their vision range, even if within attack range
- `game-settings`: Game setup/configuration includes fog of war on/off toggle

## Impact

**Core Systems Affected:**
- `js/utils/Constants.js` - Add vision ranges for each ship type
- `js/entities/Ship.js` - Add vision range property and getVisionRange() method
- `js/core/Game.js` - Track last-known enemy positions, check vision coverage before allowing attacks
- `js/map/GameMap.js` - Add vision range calculation methods (similar to attack range but with different values)
- `js/ui/Renderer.js` - Render fog overlay, ghost ships for last-known positions, hide enemy HP/status outside active vision
- New file: `js/fog/FogOfWar.js` - Manages vision tracking, last-known positions, and visibility state
- New file: `js/ui/SettingsMenu.js` - Game setup menu with fog of war toggle option

**Behavior Changes:**
- Players must scout with ships to discover enemy positions
- Small ships (Sloops) become valuable scouts due to longer vision range
- Flagships need escort ships to see effectively (vision range 2 vs attack range 3)
- Enemy ship types revealed upon first sighting, but HP/actions only visible in active vision
- Cannot attack ships outside vision range (even if you remember where they were)
- Game can be played with or without fog of war via settings toggle

**Strategic Implications:**
- Scouting phase becomes important - fast ships explore while heavy ships advance
- Island positioning offers concealment opportunities
- Flagship vulnerability - powerful but effectively blind without support
- Ghost ship positions create uncertainty - "Is that ship still there?"
- Fleet cohesion rewarded through shared vision
- Optional feature allows players to choose classic (no fog) or tactical (fog) gameplay

**No Breaking Changes For:**
- Map generation or terrain visibility (all islands always visible)
- Combat damage calculations
- Turn management
- Movement mechanics
- Line-of-sight attack blocking (vision uses same LOS rules)

**Testing Considerations:**
- Verify vision ranges calculate correctly for all ship types
- Test ghost ship rendering doesn't obscure current information
- Ensure fog toggle properly enables/disables all fog systems
- Validate shared vision works correctly across fleet
- Test edge cases: ship spotted then immediately moves out of vision
