# Sound Assets

Place audio files in this folder using these exact base names:

- `cannon_fire`
- `cannon_hit`
- `cannon_miss`
- `boarding_attempt`
- `boarding_success`
- `boarding_failure`
- `ship_sunk`
- `ship_move`
- `turn_start`
- `turn_end`
- `ship_select`
- `invalid_action`
- `button_hover`
- `menu_open`
- `menu_close`

Each sound must include both formats:

- `<name>.ogg`
- `<name>.mp3`

Example:

- `cannon_fire.ogg`
- `cannon_fire.mp3`

The game will choose a supported format at runtime and fall back silently if files are missing.

**Background Music:**

The background music file also requires both formats:

- `background_music.ogg`
- `background_music.mp3`

The background music starts automatically when the game begins and loops continuously. Volume is controlled separately via the Music Volume setting.

## ElevenLabs Sound Effect Prompts

Use these prompts with ElevenLabs to generate each sound. After generating as MP3,
convert to OGG with: `ffmpeg -i sound.mp3 sound.ogg`

### Combat / Gameplay

**`cannon_fire`** (gain: 0.9, 1-2s)
> A single black powder cannon firing on a wooden ship deck. Loud explosive boom with a brief echo over open ocean. Short duration, 1-2 seconds.

**`cannon_hit`** (gain: 0.8, 1-2s)
> A cannonball smashing through the wooden hull of a sailing ship. Splintering timber and cracking wood on impact. Short, 1-2 seconds.

**`cannon_miss`** (gain: 0.65, 1-2s)
> A heavy cannonball splashing into the ocean, missing a ship. Deep water plunge with a burst of spray. Short, 1-2 seconds.

**`boarding_attempt`** (gain: 0.75, 2-3s)
> A pirate crew shouting battle cries and war chants as they rush to board an enemy ship. Loud, aggressive voices layered over the clank of grappling hooks hitting wood. 2-3 seconds.

**`boarding_success`** (gain: 0.9, 2-3s)
> A crowd of pirates roaring in triumph and celebration on a wooden ship deck. Loud cheering, laughing, and stomping feet with faint sword clangs in the background. 2-3 seconds.

**`boarding_failure`** (gain: 0.8, 2-3s)
> Pirates groaning and cursing in frustration after a failed boarding attempt. Angry, defeated voices with the faint splash of grappling hooks falling into water. 2-3 seconds.

**`ship_sunk`** (gain: 1.0, 3-4s)
> A wooden warship catastrophically breaking apart and sinking into the ocean. Explosive cracking and splintering wood as the hull collapses, rushing water flooding in, deep groaning timbers, all blending together as the ship goes under. Chaotic and dramatic. 3-4 seconds.

**`ship_move`** (gain: 0.65, 1-2s)
> Wind billowing through canvas sails with subtle wooden hull creaks. Airy, breezy sailing sound with gentle rope tension. Minimal water sounds. Light and swift. 1-2 seconds.

**`turn_start`** (gain: 0.75, 1-2s)
> A single brass ship's bell ringing clearly on deck, signaling the start of action. Crisp metallic tone with slight ocean breeze in the background. 1-2 seconds.

**`turn_end`** (gain: 0.7, 1-2s)
> A soft double tap of a ship's bell, signaling the end of a watch. Mellow metallic ring fading into silence. Gentler than a full bell strike. 1-2 seconds.

### UI

**`ship_select`** (gain: 0.55, <1s)
> A soft wooden click, like tapping a ship token on a navigation chart table. Gentle, tactile, satisfying. Very short, under 1 second.

**`invalid_action`** (gain: 0.8, <1s)
> A low-pitched wooden thud, like a blocked or denied action on a ship. Dull, brief, slightly negative. Under 1 second.

**`button_hover`** (gain: 0.4, <0.5s)
> A very soft, quiet tick — like a fingertip brushing a wooden surface or the faintest rope creak. Barely audible, extremely short, under half a second.

**`menu_open`** (gain: 0.6, ~1s)
> An old parchment map being unrolled on a wooden table. Soft paper rustling with a slight wooden creak. Brief, 1 second.

**`menu_close`** (gain: 0.55, <1s)
> A parchment map being rolled up and set down on a wooden table. Soft paper folding sound, slightly quicker and quieter than unrolling. Under 1 second.

---

## Background Music

**`background_music`** (looping, ~2-3 minutes recommended)
> Dark, moody pirate sea shanty with a slow, deliberate cadence. Begin with ocean waves and distant seagull cries as an ambient layer beneath the music. Atmosphere should be intense and foreboding — this is naval combat, not celebration. Include deep rhythmic percussion, low strings or fiddle, accordion drones, and a haunting melody. Slow tempo, brooding and atmospheric. Think menacing sea shanty meets cinematic tension. Should loop seamlessly for combat gameplay background.
