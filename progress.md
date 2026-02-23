Original prompt: Implement the provided Octagon Asteroids Clone (Vite + TypeScript) plan.

- Scaffolded project files and source directories.
- Implemented octagon geometry (containment, wrap translation, ghost-offset generation).
- Implemented fixed-step loop, input manager, game state machine, and browser debug hooks:
  - `window.advanceTime(ms)`
  - `window.render_game_to_text()`
- Implemented classic wireframe canvas renderer with octagon clipping/boundary and wrapped ghost copies.
- Implemented gameplay systems:
  - ship movement/thrust/fire
  - bullets with TTL and wrap
  - asteroid spawning, splitting, scoring
  - waves, lives, respawn/invulnerability
  - UFO spawn/movement/fire and scoring
  - hyperspace with safe-placement attempts + failure destroys ship
- Implemented procedural Web Audio engine (thrust, UFO hum, heartbeat pulse, one-shot SFX, mute support).
- Added Vitest unit tests for octagon geometry/wrap and segment-circle collision.
- Validation completed:
  - `npm test` ✅
  - `npm run build` ✅
  - Playwright smoke run via develop-web-game client ✅ (screenshot + `render_game_to_text`, no console error artifact)

TODO / follow-ups:
- Add scripted deterministic gameplay integration tests that assert scoring/splits/wave transitions through `window.advanceTime`.
- Extend Playwright smoke coverage to exercise pause/fullscreen/mute and (if client mapping supports it) hyperspace key path.
- Fine-tune UFO aiming and wave difficulty constants for closer arcade feel.
- Optional polish: line-glow toggle, better start/game-over typography, persistent local high score.
