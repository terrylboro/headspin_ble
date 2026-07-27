# NHS theme migration plan

Extracted from the opencode analysis session ("Migrating app to
mantine-nhs-theme", July 2026). This is the working plan for adopting
`@mkltd/mantine-nhs-theme` in this app.

## Status

- [x] CRA → Vite migration (prerequisite, branch `vite-migration`)
- [ ] Theme package made consumable (see "Package problems" below)
- [ ] Dev-mode Bluetooth simulator so UI work doesn't need the IMU hardware
- [ ] App integration (provider swap + styling cleanup)
- [ ] Responsive layout fix for the setup screen

## Why the theme package had to be fixed first

`@mkltd/mantine-nhs-theme@0.2.1` could not be consumed cleanly, especially by
CRA/Webpack:

- Published ESM uses extensionless internal imports (`./provider` instead of
  `./provider.js`); Webpack's strict ESM resolution rejects these.
- Published component styles are raw `.module.scss`; consumers would need to
  install Sass and configure NHS Sass lookup paths themselves.
- eVRT masks both problems through Vite aliases, `sass-embedded` and custom
  `loadPaths` — that workaround should not be copied here.

The fix belongs in the package: bundle internal JS, precompile component SCSS
into browser-ready CSS, keep React and Mantine external, and add a consumer
smoke test (Webpack + Vite) before publishing `0.2.2`.

A disposable preview with these workarounds confirmed the desired result:
Frutiger font, NHS blue `#005eb8`, NHS body grey, NHS cards, focus mode and
semantic button variants all apply correctly.

## App integration steps (once the fixed package is published)

1. Add `.npmrc`:

   ```ini
   @mkltd:registry=https://npm.pkg.github.com
   ```

2. `npm install @mkltd/mantine-nhs-theme @mantine/dates`

3. Replace the Mantine provider in `src/index.tsx`:

   ```tsx
   import '@mantine/core/styles.css';
   import '@mkltd/mantine-nhs-theme/global.css';
   import { NHSMantineProvider } from '@mkltd/mantine-nhs-theme';
   import './index.css';
   ```

   Use `<NHSMantineProvider defaultColorScheme="light">`.

4. Remove the system `font-family` declaration from `src/index.css`.

5. Remove the inline blue header / grey main background in `src/App.tsx` so
   the theme's `AppShell` styles apply.

6. Replace colour-driven buttons with NHS semantic variants:

   ```tsx
   <Button variant={selected ? 'filled' : 'secondary'} />
   <Button variant="reverse">Back to setup</Button>
   ```

7. Replace the hard-coded selected-canal blue (`#228be6`) with
   `--mantine-color-nhsuk-blue-6`.

8. Layout: NHS typography/button scale breaks the three-column setup grid
   around tablet width. Move that breakpoint to desktop and allow scrolling
   below it.

## Recommended project follow-ups (from the same session)

Highest value:

- CI: run `npm ci`, `npm test`, `npm run build` on every PR.
- Pin Node 22 via `.nvmrc` and `engines.node`.
- A short `AGENTS.md` documenting project-specific facts (commands, GitHub
  Pages base path, `publicAsset()` rule, Web Bluetooth constraints, screen
  flow).

Useful later:

- Rewrite `README.md`.
- Unit tests for the treatment reducer, IMU decoder and alignment logic.
- Replace hard-coded `testMode = false` with a `VITE_TEST_MODE` env flag.
- ESLint, once existing warnings can be cleaned quietly.
- Lazy-load research/test panels and Three.js screens to shrink the ~1.2 MB
  main bundle.
