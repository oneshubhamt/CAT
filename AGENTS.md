# CAT Playbook — maintainer guide

## Working agreement

- Make changes on `working`. Keep `main` stable until the owner explicitly requests propagation.
- The deployable application is **one file: `index.html`**. No framework, runtime build step, ES-module imports, external application JS/CSS files, server, database service, remote fonts or CDN requests. The embedded stylesheet and system font stack allow a downloaded HTML copy to open without internet. An uncached hosted URL still requires network access; this is not a service-worker PWA.
- `AGENTS.md`, `tests/` and `tools/` are development-only. Downloaded HTML must not depend on them.
- Keep strategic/content changes separate from structural refactors. Do not change exam rules, targets, dates or historical claims without explicit scope and evidence.
- Do not add legacy-data migration unless requested. Preserve existing v2 record snapshots and the IndexedDB schema.

## Navigation map

Search for these stable anchors rather than relying on line numbers.

| HTML marker | Ownership |
| --- | --- |
| `region:design-tokens` / `#cat-offline-css`, `region:print-styles` | Embedded generated CSS, palette and print CSS |
| `region:mobile-layout` / `#cat-mobile-layout` | Authored responsive layout, touch sizing, table cards and safe-area handling |
| `region:portable-state` / `#embedded-user-state` | Portable JSON payload (empty in repository baseline) |
| `region:toolbar` | Header controls, tabs, persistence status |
| `region:overview`, `region:quick-revision` | Overview, clocks, scenarios, compact view, checklist |
| `region:error-log` | Error-log form and list |
| `region:varc`, `region:dilr`, `region:qa` | Detailed strategy content |
| `region:dilr-personal-selection`, `region:qa-skip-routing` | Personalised set triage and QA skip classes |
| `region:rule-hierarchy`, `region:dilr-case-discipline` | Decision precedence and conditional-case safeguards |
| `region:exam-logistics` | Dated, source-qualified exam logistics and optional online links |
| `region:strategy-detail-*` / `data-strategy-detail` | Native expandable reading sections; main clocks, recovery and skip routing remain visible |
| `#cat-app` | Entire application script |

Inside `#cat-app`, each `<module:ID>` / `</module:ID>` comment pair encloses one module.

| Module | Responsibility / public contract |
| --- | --- |
| `strategy` | Pure strategy data, mode definitions, derived clocks and score math: `validModes`, `orders`, `fixedClocks`, `fixedBars`, `checkpoints`, `planValues(mode)`, `scenarioValues(mode)` |
| `schema` | Defaults, record validation, ordering, versioned snapshot encoding/decoding |
| `record-model` | Private records and immutable state projection; per-record versioning, tombstones |
| `persistence` | IndexedDB transport, bounded emergency journal, pending writes, recovery, lifecycle; `view()`, `setRecord()`, `loadState()`, `reconcileDatabase()`, `safeSnapshot()` |
| `feedback` | Storage status and toast UI |
| `shell` | Theme, tab navigation, keyboard shortcuts, compact revision and print |
| `checklist` | Readiness items and reset |
| `notes` | Note editing, autosave requests, note badges |
| `error-log` | Error-log CRUD, form state, review and filtering |
| `plan-view` | VARC mode selection; synchronize all section clocks, recovery diagrams, shared checkpoint/score bindings, headings, scenario table and revision view |
| `export` | Clone, sanitize, embed validated snapshot and prepare portable HTML download |
| `bootstrap` | Composition root; creates modules, injects dependencies, hydrates, renders and binds once |

## Dependency direction

```
strategy -> schema -> record-model -> persistence
                    (pure model)      (browser storage)
feature views -> persistence public API
plan-view -> strategy + checklist public API
export -> persistence + schema
bootstrap -> all feature modules and feedback
```

The application uses a classic script in a private IIFE, not global application state or ES modules. Feature factories return small frozen interfaces. The composition root wires cross-module callbacks; do not have the persistence service directly query or render feature DOM. UI modules read `storage.view()` (frozen projection, re-read after mutation), and change data only with `storage.setRecord(key,value,delay)`. Keep temporary UI state in the feature that owns it.

## Important invariants

- Canonical mode data: edit `MODES` inside strategy. Segment `start`/`end` are elapsed minutes; widths/time labels and compact clock derive from them. All modes cover 0–40 without gaps/overlaps. Review human-authored detail/caption/summary wording when changing timing. Use `data-plan` bindings for synchronized dynamic content.
- Non-VARC strategy: `FIXED_CLOCKS` owns the DILR and QA phase boundaries and both DILR recovery examples; `fixedBars` projects the compact DILR overview bar (optional and audit phases combined). `CHECKPOINTS` owns DILR reassessment/switch and QA ignition/round checkpoints. `SCORE_TARGETS` owns primary DILR/QA correct-answer-derived marks. Use `data-plan` for text projections and `data-fixed-segment="section:index"` with `data-clock-label` / `data-clock-time` for the 24 fixed bar elements. `renderPlan` must fill these from the model. Review residual explanatory prose (such as the QA first-pass minute references and historical pattern) if timing changes. Do not reintroduce separate numeric UI constants.
- Seven native `details[data-strategy-detail]` disclosures keep secondary techniques and reference tables compact. RC execution and QA mechanical rules start open, five supplementary sections start collapsed. Do not place the primary pacing, personalised DILR selection/recovery or QA skip routing inside collapsed sections. Disclosures are local view state, not a new persistence record. The screenshot suite opens the appropriate disclosures before inspecting their content. The theme toggle's stable accessible name is Dark mode, with pressed state synchronized on hydration and changes.
- Record keys: `pref:theme`, `pref:varcOrder`, `check:<id>`, `note:<section>`, `error:<id>`. Record shape: `{key,value,time,seq,writer}`. Errors deleted with `value:null` tombstones. Ordering is time, sequence, writer.
- IndexedDB: `cat99_playbook`, database version 1, store `records`, key path `key`. Portable snapshot: `{schemaVersion:2,records:[...]}`. No migration in this refactor. Schema changes require explicit review of validation, recovery and export compatibility.
- LocalStorage is **only** a write-ahead emergency journal under `cat99_emergency_v2:` (64 KiB per journal). Journal keys are immutable generations; retire them only after durable transaction completion/reconciliation. Do not add full-state mirroring.
- Preserve data on failed transactions; never claim an IndexedDB save until confirmed. Keep snapshot escaping of less-than characters and record validation. Do not render personal content through innerHTML.
- Keep DOM IDs and data attributes stable across markup, renderers and export clone cleanup. If adding a persisted feature, update schema/model, UI, bootstrap and portable export as necessary.
- Preserve download from a local file as well as hosted use. Browser storage can be unavailable or evicted; portable export remains the backup.

## Content and readability

Use plain, direct English and short action-led headings. State what to do, when to do it, and what exception matters. Prefer a short list, paired decision cards, a labelled timeline or a compact table over a dense paragraph when structure helps. Use visual emphasis for time limits and key decisions, not decoration. Keep definitions accessible; explain technical terms or use their plain-language equivalents. Preserve meaningful deductions, examples, verification steps, conditional rules, numerical targets and source qualifications when shortening. Avoid jargon, motivational filler and repeating the same instruction in several forms. Use `data-read-steps`, `data-selection-steps`, `data-decision-grid` and `data-glossary` for the established reading patterns. Check layout at phone widths; keep dark-mode contrast, accessible disclosure labels and the offline single-file contract.

## Strategy and logistics maintenance

The four-level hierarchy is authoritative within the playbook: official instructions/safeguards > adaptive checkpoints > default plans > preferences. Keep the quick revision, matrix, clocks, mode configuration, detailed section cards and readiness checklist consistent. Never turn timing targets or TITA availability into unconditional quotas. QA rolling triage gives unseen questions an initial assessment before lower-value revisits; DILR preserves master facts separately from hypothetical questions. Verify the official CAT portal and current candidate instructions before changing dated logistics. The 26 November 2026 review used mirrored IIM releases and qualified secondary reporting because the portal and direct mock were not accessible through the research environment. Do not promote reported details to official verification. Personal admit-card instructions control. Ordinary user-activated source links are allowed; they must not create automatic network requests or runtime dependencies.

## Offline CSS maintenance

`tools/build-offline-css.cjs` emits the static stylesheet into `#cat-offline-css`. This small dependency-free compiler supports only the utility vocabulary actually used by the playbook; it is not Tailwind itself. Do not hand-edit the generated block. When adding styles, update the compiler's vocabulary or explicit dynamic-class manifest if necessary, regenerate and commit the HTML. Keep literal class attributes, mode-segment classes and dynamic DOM class changes covered. Do not introduce network-loaded assets or fonts. The existing print CSS remains a separate authored block.

```sh
node tools/build-offline-css.cjs
node tools/build-offline-css.cjs --check
```

The runtime has no dependency on Node or the generator. Use a saved HTML file for offline travel; private browsing, origin-specific storage policies or browser eviction can still prevent persistence. Export a backup before travelling.

## Validation

Run the dependency-free development test from repository root:

```sh
node tools/build-offline-css.cjs --check
node tests/smoke.cjs
```

This executes the actual inline application source with simulated DOM/storage APIs; it is not a browser compatibility or visual regression test. For UI/storage changes, additionally open `index.html` in a real browser: switch all three modes and tabs, toggle revision/theme, edit notes and checklist, add/edit/delete an error, reload, test IndexedDB failure/recovery, download/reopen HTML, and check print output. Test local file and hosted origins when possible. In a native browser with network disabled, open a fresh downloaded file, exercise responsive layout, dark mode, all tabs and export/reopen; verify that no requests are required.

Before committing, inspect the diff for unrelated content changes, syntax errors, duplicate IDs, schema/anchor changes and unintended personal data in the portable snapshot. Report any checks not actually run.

## Mobile browser checks

Keep the responsive overrides in `#cat-mobile-layout` rather than manually editing generated CSS. All four tabs must be immediately visible on a 320px phone. Controls have 44px targets; inputs use 16px on phones. The header's measured toolbar height allows the brand and actions to scroll away while the tab/status strip stays pinned; the active tab returns to the top. Dark-theme accent text is explicitly lightened for contrast. The six pacing bars reflow into readable phase tiles, and all four tables use labelled cell wrappers on mobile. Preserve the actual desktop table semantics and the data-cell-label/value hooks in both static markup and dynamic scenario rows. Do not hide document overflow to mask layout defects.

Native screenshot suite (development-only dependencies):

```sh
npm install --no-save playwright
npx playwright install chromium webkit
node tests/mobile-browser.cjs
```

The suite opens the actual local HTML offline at 320, 360, 390, 430, 768, 844 landscape and 1280 CSS-pixel widths in Chromium and WebKit. It exercises section navigation, all VARC modes, revision, dark mode, notes, error-log entry, and portable export/reopen; asserts page width, touch sizes, clipping and network independence; captures screenshots and a layout-report JSON under `artifacts/mobile/`. Review screenshot appearance in addition to numeric assertions. `CAT_ENGINE=chromium` or `webkit` restricts the engine. `CAT_SCREENSHOTS` overrides the artifact directory. Do not commit generated backups or screenshot output (they may include private notes). Report actual test results, not just the existence of a test suite.
