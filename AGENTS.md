# CAT Playbook — maintainer guide

## Working agreement

- Make changes on `working`. Keep `main` stable until the owner explicitly requests propagation.
- The deployable application is **one file: `index.html`**. No framework, build step, ES-module imports, external application JS/CSS files, server, or database service. Existing CDN Tailwind and Google Fonts remain; do not imply that the current file is fully offline.
- `AGENTS.md` and `tests/` are development-only. Downloaded HTML must not depend on them.
- Keep strategic/content changes separate from structural refactors. Do not change exam rules, targets, dates or historical claims without explicit scope and evidence.
- Do not add legacy-data migration unless requested. Preserve existing v2 record snapshots and the IndexedDB schema.

## Navigation map

Search for these stable anchors rather than relying on line numbers.

| HTML marker | Ownership |
| --- | --- |
| `region:design-tokens`, `region:print-styles` | Theme tokens and print CSS |
| `region:portable-state` / `#embedded-user-state` | Portable JSON payload (empty in repository baseline) |
| `region:toolbar` | Header controls, tabs, persistence status |
| `region:overview`, `region:quick-revision` | Overview, clocks, scenarios, compact view, checklist |
| `region:error-log` | Error-log form and list |
| `region:varc`, `region:dilr`, `region:qa` | Detailed strategy content |
| `#cat-app` | Entire application script |

Inside `#cat-app`, each `<module:ID>` / `</module:ID>` comment pair encloses one module.

| Module | Responsibility / public contract |
| --- | --- |
| `strategy` | Pure strategy data, mode definitions, derived clocks and score math: `validModes`, `orders`, `planValues(mode)`, `scenarioValues(mode)` |
| `schema` | Defaults, record validation, ordering, versioned snapshot encoding/decoding |
| `record-model` | Private records and immutable state projection; per-record versioning, tombstones |
| `persistence` | IndexedDB transport, bounded emergency journal, pending writes, recovery, lifecycle; `view()`, `setRecord()`, `loadState()`, `reconcileDatabase()`, `safeSnapshot()` |
| `feedback` | Storage status and toast UI |
| `shell` | Theme, tab navigation, keyboard shortcuts, compact revision and print |
| `checklist` | Readiness items and reset |
| `notes` | Note editing, autosave requests, note badges |
| `error-log` | Error-log CRUD, form state, review and filtering |
| `plan-view` | VARC mode selection; synchronize timelines, headings, targets, scenario table and revision view |
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
- Record keys: `pref:theme`, `pref:varcOrder`, `check:<id>`, `note:<section>`, `error:<id>`. Record shape: `{key,value,time,seq,writer}`. Errors deleted with `value:null` tombstones. Ordering is time, sequence, writer.
- IndexedDB: `cat99_playbook`, database version 1, store `records`, key path `key`. Portable snapshot: `{schemaVersion:2,records:[...]}`. No migration in this refactor. Schema changes require explicit review of validation, recovery and export compatibility.
- LocalStorage is **only** a write-ahead emergency journal under `cat99_emergency_v2:` (64 KiB per journal). Journal keys are immutable generations; retire them only after durable transaction completion/reconciliation. Do not add full-state mirroring.
- Preserve data on failed transactions; never claim an IndexedDB save until confirmed. Keep snapshot escaping of less-than characters and record validation. Do not render personal content through innerHTML.
- Keep DOM IDs and data attributes stable across markup, renderers and export clone cleanup. If adding a persisted feature, update schema/model, UI, bootstrap and portable export as necessary.
- Preserve download from a local file as well as hosted use. Browser storage can be unavailable or evicted; portable export remains the backup.

## Validation

Run the dependency-free development test from repository root:

```sh
node tests/smoke.cjs
```

This executes the actual inline application source with simulated DOM/storage APIs; it is not a browser compatibility or visual regression test. For UI/storage changes, additionally open `index.html` in a real browser: switch all three modes and tabs, toggle revision/theme, edit notes and checklist, add/edit/delete an error, reload, test IndexedDB failure/recovery, download/reopen HTML, and check print output. Test local file and hosted origins when possible.

Before committing, inspect the diff for unrelated content changes, syntax errors, duplicate IDs, schema/anchor changes and unintended personal data in the portable snapshot. Report any checks not actually run.
