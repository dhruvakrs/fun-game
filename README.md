# fun-game

Simple 2D side-scrolling platformer built with TypeScript, Vite, and the Canvas 2D API. Dodge spikes, grab coins, and reach the goal flag before running out of lives.

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

- Enter: start
- R: restart
- Arrow keys or A/D: move left/right
- Space: jump

## Gameplay

- HUD shows `Score`, `Coins`, and `Lives` (3 per run).
- Collect coins (+100 each). Collected coins persist across deaths in the same run.
- Spikes or falling off-screen cost 1 life and respawn the player.
- Reach the flag to finish the level (+500). Game over when lives hit 0.
- Camera smoothly follows the player horizontally.

## Project Structure

- `src/engine/` – loop, input, camera, and collision helpers.
- `src/game/` – entities, level data, player, and game state.
- `src/main.ts` – wiring, HUD rendering, and screen state handling.
- `src/styles.css` – basic layout styling.

Level tiles are defined in `src/game/level.ts` using symbols:

- `#` ground, `=` platform
- `C` coin, `S` spike/hazard
- `P` player spawn, `G` goal flag

## Notes

- Art and effects are original, using simple geometric shapes. Optional Web Audio tones provide feedback for coin pickup, hits, and level completion.
- Ready for Git hosting: `node_modules`, `dist`, and OS/editor junk are ignored via `.gitignore`.
