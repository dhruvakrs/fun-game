# fun-game

Simple 2D side-scrolling platformer built with TypeScript, Vite, and the Canvas 2D API. Dodge spikes, ride bounce pads, collect coins, and sprint across two levels with original art and audio.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the printed local URL in your browser.

## Controls

- Enter: start / advance to the next level after completing one
- R: restart the current level/run
- Arrow keys or A/D: move left/right
- Space: jump (hold to extend jump; buffers + coyote time help near edges)

## Gameplay

- Two levels: Level 1 (Rooftop Run) eases you in; Level 2 (Skyline Sprint) adds moving enemies, bounce pads, and tighter jumps.
- HUD shows `Score`, `Coins`, `Lives`, and the current level name. Coins (+100) persist across deaths during a run; finish a level for a +500 bonus.
- Hazards: spike strips, rolling boulders, rotating fire bars, and cute-but-dangerous enemies (turtle walker, hopping slime, and patrolling bird). Collision costs 1 life and respawns you.
- Bounce pads launch you upward with squash/stretch animation; you can chain bounces and steer mid-air.
- Coins include flashing trails over harder jumps (arc patterns) to guide spacing. Camera smoothly follows horizontally.

## Project Structure

- `src/engine/` – loop, input, camera, collision helpers.
- `src/game/config.ts` – tweak gravity, jump, bounce strength, coin value, etc.
- `src/game/levels.ts` – level layouts and dynamic entity definitions.
- `src/game/level.ts` – level loader that spawns tiles/entities and coin trails.
- `src/game/entities/` – player, enemies, bounce pads, and obstacle logic.
- `src/game/render/` – drawing for player, coins, bounce pads, obstacles, enemies.
- `src/game/ui/` – HUD bar, screens, score pops.
- `src/main.ts` – wiring, game loop, state transitions.
- `src/styles.css` – layout styling.

Tile symbols in the level maps:

- `#` ground, `=` platform
- `C` coin, `B` bounce pad, `S` spike/hazard
- `P` player spawn, `G` goal flag

## Notes

- Art and effects are original, using simple geometric shapes. Optional Web Audio tones provide feedback for coin pickup, bounces, hits, and level completion.
- Ready for Git hosting: `node_modules`, `dist`, and OS/editor junk are ignored via `.gitignore`.
