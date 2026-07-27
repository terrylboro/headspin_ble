# Development workflow (post-Vite)

The app was migrated from Create React App to Vite 8. This document covers what
changed day-to-day.

## Commands

| Task | Old (CRA) | New (Vite) |
| --- | --- | --- |
| Dev server | `npm start` (react-scripts) | `npm run dev` (or `npm start`, both run `vite`) |
| Production build | `npm run build` | `npm run build` (`tsc --noEmit` then `vite build`) |
| Serve the production build locally | npx serve | `npm run preview` |
| Tests | `npm test` (Jest watch) | `npm test` (Vitest, single run) / `npm run test:watch` |
| Deploy to GitHub Pages | `npm run deploy` | unchanged (`gh-pages -d dist`) |

The dev server starts on <http://localhost:5173/headspin_ble/> and reloads on
file save. Builds and test runs are noticeably faster than CRA.

## Things that work differently

- **`index.html` lives in the repo root**, not `public/`. It references
  `/src/index.tsx` directly; Vite does the bundling.
- **Public asset paths:** never use `process.env.PUBLIC_URL` (that was CRA).
  Use the helper in `src/utils/publicAsset.ts`:

  ```ts
  import { publicAsset } from '../utils/publicAsset';

  <Image src={publicAsset('/diagrams/example.png')} />
  ```

  This prefixes Vite's `BASE_URL`, so assets keep working when the app is
  served from `/headspin_ble/` on GitHub Pages.
- **Environment variables:** Vite exposes `import.meta.env`, not `process.env`.
  Custom variables must be prefixed `VITE_` and defined in a `.env` file
  (e.g. `VITE_TEST_MODE=true`).
- **Tests are Vitest, not Jest.** Test files and the Testing Library API are
  the same. Config lives in `vite.config.ts` under `test`, shared setup in
  `src/setupTests.ts` (includes a `matchMedia` shim jsdom needs for Mantine).
- **Types:** `src/react-app-env.d.ts` is gone; `src/vite-env.d.ts` references
  Vite's client types instead.

## Hardware notes

- Web Bluetooth only works in Chrome/Edge on a secure context (localhost is
  fine).
- Without the IMU device you can't progress past the Connect step; a dev-mode
  simulator is planned to unblock UI development (see
  `docs/theme-migration.md`).
- Gyroscope bias calibration values live in `decodeNumericImuPacket()` in
  `src/utils/imuDecoder.ts`.

## Known follow-ups

- The production bundle warns about size (~1.2 MB, mostly Three.js). Code
  splitting is a possible future improvement, not a bug.
- `README.md` still describes the original project setup; this file is the
  source of truth for the current toolchain.
