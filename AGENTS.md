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
node tests/visual-contract.cjs
```

This executes the actual inline application source with simulated DOM/storage APIs; it is not a browser compatibility or visual regression test. For UI/storage changes, additionally open `index.html` in a real browser: switch all three modes and tabs, toggle revision/theme, edit notes and checklist, add/edit/delete an error, reload, test IndexedDB failure/recovery, and download/reopen HTML. Test local file and hosted origins when possible. In a native browser with network disabled, open a fresh downloaded file, exercise responsive layout, dark mode, all tabs and export/reopen; verify that no requests are required.

Before committing, inspect the diff for unrelated content changes, syntax errors, duplicate IDs, schema/anchor changes and unintended personal data in the portable snapshot. Report any checks not actually run.

## Visual browser QA

Keep the responsive overrides in `#cat-mobile-layout`. At 320px all four tabs must fit, primary controls have 44px targets, and editable fields should use 16px on phones. Maintain the measured pinned navigation strip, light/dark contrast, responsive pacing tiles, labelled mobile table cells and readable disclosure content. Do not mask horizontal overflow or clipping with document-level overflow rules.

### Coverage policy

The manifest in `tests/visual-matrix.cjs` is the source of truth. Run distinct, justified profiles instead of a Cartesian product of every device, theme, screen and state. All visual profiles exercise four tabs, all three VARC modes, the quick view, all seven strategy disclosures and each timeline accent. Deep profiles additionally capture all four expanded panels (full-page evidence), a scrolled viewport in each section and a mode toast. Each profile captures one assigned mode; the other modes still receive layout checks. Contrast is sampled on expanded content and the assigned revision mode, not repeated on every interaction.

| Tier | Visual profiles | Stateful journeys | Extra responsive edges |
| --- | ---: | ---: | --- |
| Core | 8 (5 deep) | 4 | — |
| Full | 17 (6 deep) | 6 | 10 sizes × 5 views |

Core includes Chromium and WebKit, 320/390/430px phones, a 768px tablet, short landscape and desktop, with both themes and all screenshot modes represented on each engine. Full adds Firefox, 360/1024/1440px and further theme combinations. The separate layout-only boundary pass checks 639/640, 767/768, 1023/1024, 1279/1280px and landscape heights 499/501px. No routine duplicate screenshots at both edges; capture distinct failures instead. Profiles simulate viewports and touch, not certified physical devices.

The four core state journeys cover normal hosted-origin IndexedDB, notes in all sections, checklist reset/mode reset, error-log validation/CRUD/review/filtering, cross-tab refresh, local-file WebKit export/reopen, journal fallback/retry and memory-only backup. Full adds keyboard/focus/live resize and durable Firefox. Use synthetic fixtures, a fresh browser context per scenario, an ephemeral loopback origin for native durable-storage checks, and a separate offline context to reopen each portable backup. Never use a user's personal export as input. Printing is intentionally excluded.

### Run and inspect

```sh
node tests/visual-contract.cjs
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium webkit firefox
node tests/mobile-browser.cjs --list
node tests/mobile-browser.cjs
CAT_TIER=full node tests/mobile-browser.cjs
CAT_TIER=full CAT_ENGINE=chromium CAT_PROFILE=boundaries node tests/mobile-browser.cjs
CAT_ENGINE=webkit CAT_PROFILE=w390-light node tests/mobile-browser.cjs
```

Set `CAT_SCREENSHOTS` to a fresh output directory if keeping previous runs. Default: `artifacts/mobile/`. Open the evidence gallery (`index.html`) to review full-resolution screenshots, actual scenario results, layout findings and links to failure traces. The JSON report lists the planned and attempted scenarios, browser versions, viewport, measurements, interaction coverage and evidence paths. Baseline screenshots suppress transient toasts; a dedicated toast state is captured on deep profiles. The runner continues across scenario failures, records geometry defects, deduplicates failure screenshots, and exits nonzero for failed or incomplete runs. Long panels use viewport strips if needed.

Geometry checks detect document/control overflow, clipped content, wrong active tabs, empty rendered plan bindings, minimum primary touch sizes and pinned/landscape header errors. Estimated solid-background contrast, smaller secondary controls and intentionally narrow desktop timeline segments are reported as review warnings; do not equate them with a complete accessibility audit. Human review of screenshots is still necessary. Never weaken a failing geometric assertion merely to obtain a green result.

### Regression comparisons

After reviewing a successful run, keep its artifact as an approved reference. Use the optional comparison tool on two matching evidence directories from the same OS, architecture and browser version:

```sh
npm install --no-save --package-lock=false pngjs@7.0.0 pixelmatch@5.3.0
node tests/visual-compare.cjs /path/to/approved /path/to/current
node tests/visual-compare.cjs /path/to/approved /path/to/current --strict
```

The tool matches successful profile/state screenshots, reports changed dimensions, changed-pixel fractions, diff PNGs and unmatched states. The default changed-pixel review threshold is 0.5% (`CAT_DIFF_RATIO=0.005`); color differences use pixelmatch threshold 0.1 with antialiasing excluded. Strict mode fails for changes or missing coverage. Never auto-approve baselines or interpret pixel equality as usability. Compare equivalent runner/browser/font environments; expected content changes require review.

### CI and ownership

`.github/workflows/mobile-browser.yml` runs source checks once, then browser jobs in parallel. Relevant pushes to `working` run core; a commit message containing `[visual-full]` selects the full tier. Manual dispatch supports either tier when the workflow is available on the default branch. Superseded runs cancel. Each engine uploads its gallery, JSON, PNG evidence and failure traces even when a test fails. Review actual job results before calling any browser test passed. Keep the current single-file application independent of this development tooling. Do not commit generated screenshots, traces, personal backups or node_modules.

Modules: `visual-matrix.cjs` (selection and coverage), `visual-contract.cjs` (coverage guards), `mobile-browser.cjs` (orchestration and isolation), `visual-audit.cjs` (measurements), `visual-screens.cjs` (screen/mode checks), `visual-journeys.cjs` (stateful flows), `visual-report.cjs` (gallery), `visual-compare.cjs` (optional reference comparison).
