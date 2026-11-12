# ui/dist build notes

Recorded for the 0.2.0 release (open-lex-it plan-c, blocks 19-23). The Host never builds; the committed `dist` is the registered artifact.

| Item | Value |
|---|---|
| Command | `npm ci && npm run build` |
| SDK | `@olx/package-ui-sdk` 0.2.2 from `vendor/olx-package-ui-sdk-0.2.2.tgz` (the same tarball as `dp-it-prassi`, copied, not rebuilt) |
| `du -sb dist` | 479321 bytes (limit `PackageUi:MaxBytes` 5 MB) |
| `main.js` | 436115 bytes (limit per file 1.5 MB) |
| chunks | none (single bundle, no lazy chunks) |
| `styles.css` | 0 bytes (the package relies on the Host PrimeNG theme) |
| `3rdpartylicenses.txt` | 43188 bytes |
| `prerendered-routes.json` | 18 bytes |
| files in `dist` | 4 |
| `grep -c "zone.js" dist/main.js` | 0 (zoneless) |
| Custom elements | `dp-sk-judikatura-corpus`, `dp-sk-judikatura-decision`, `dp-sk-judikatura-status` (the SDK requires the prefix `dp-<package name>-`) |
| Determinism | a second `npm run build` (after deleting `dist` and `.angular`) gives the same md5 for the four files (`outputHashing: none`) |
| md5 | `main.js` ddef410bb3fb80e0e87c2a47810b6018, `3rdpartylicenses.txt` 4a0ddff082829e6aa72c232cd197096d, `prerendered-routes.json` d5eabf3e8b1c211a1474cb10914ca1c1, `styles.css` d41d8cd98f00b204e9800998ecf8427e |
| Unit tests | `npm test` (Vitest through `ng test`): 8 files, 101 passed, 5 skipped; `npm run lint` clean |

The lock file derives from the one of `dp-it-prassi` (package name replaced); `npm ci` works.

The 5 skipped tests are the `manifest-ui.spec.ts` checks of the Manifest `ui` block: `dataplatform.json` has no `ui` block until plan-c block 23 adds it (Screens `corpus` default, `decision`, `status`; elements `dp-sk-judikatura-*`; permissions `tools:search|lookup|rozhodnutie|status` and `navigate`). They run unchanged the day the block exists.

The specs validate every argument object a Screen sends against the real Tool schemas in `../serving/tools/public` (`src/app/testing/tool-schemas.ts`), so a Screen that drifts from a Tool fails its own spec. The `built bundle` checks of `manifest-ui.spec.ts` read `dist/`, so run `npm run build` before `npm test` on a fresh clone.
