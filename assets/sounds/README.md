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
