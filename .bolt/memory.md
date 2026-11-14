# Project memory

## Product intent & audience

- Expo app targeting **Android** and **Web** platforms
- Uses **expo-sqlite** for local/client-side data storage (web uses SQLite WASM)
- Production Android builds distributed via **EAS** (AAB output)

## Brand personality & voice

- Not yet inferred from context

## Visual design & UX direction

- Not yet inferred from context

## Decisions, constraints & rationale

- **Expo SDK 55** — package versions pinned to match (e.g. `react-native-web`)
- **expo-router** used for navigation; web entry via `expo-router/entry`
- `react-native-web` must be installed for web bundling — added at SDK 55-matching version
- **expo-sqlite** web support requires Metro to recognize `.wasm` assets
  - Created `metro.config.js` adding `wasm` extension so WASM files bundle for web
- TypeScript project; type-check part of verification gate
- Verification checklist before deploy: web bundle export, Android bundle export, `expo doctor`, TS check, unit tests
  - Latest run: Expo Doctor 20/20, TS pass, 22/22 unit tests pass, both bundle exports PASS
- No `.bolt/prompt` authoritative instructions present

## Open questions & assumptions

- SQLite-on-web runtime behavior **not yet verified** — only bundle build confirmed; needs post-deploy runtime check
- Production AAB build still **pending EAS login**
- If deploy fails again, user will share full log for diagnosis