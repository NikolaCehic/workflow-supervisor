# Changelog

This changelog was reconstructed from npm publish metadata and git history after the first four package versions were published without GitHub releases or tags.

## 0.1.3 - 2026-06-17

Published to npm: 2026-06-17 22:09:08 UTC

Commit: `154bbd7`

### Added

- Added resumable SPEC gate behavior so broad source-controlled workflows can pause for human review before final work units, dossiers, and implementation.
- Added resume guidance for autonomous workflows that block on a human decision, including updates to workflow state, goal state, and decision artifacts.
- Expanded troubleshooting guidance for broad roadmap scope, residual risks that hide required work, and SPEC review before work units.

### Changed

- Hardened workflow-supervisor scope coverage so material source requirements, roadmap phases, exit criteria, named systems, and numeric targets must be mapped to work units, explicitly deferred, blocked, or marked non-material.
- Updated acceptance, loop-policy, work-unit, and workflow-docs instructions to preserve source requirement strength and avoid quiet downgrades.

### Verified

- Expanded workflow-supervisor lifecycle tests for source coverage, SPEC review, and resume behavior.

## 0.1.2 - 2026-06-17

Published to npm: 2026-06-17 16:00:10 UTC

Commit: `b449656`

### Changed

- Reworked the workflow-supervisor skill around a stricter worker-agent supervisor architecture.
- Made explicit supervisor invocation require full intake, work units, dossiers, worker-agent contracts, scoped handoffs, report schema, and verification even for small tasks.
- Clarified that implementation, verification, repair-authoring, and documentation are separate worker-agent responsibilities when an automated worker path is available.
- Rewrote the README around the strict worker supervisor model and the current package workflow.

### Verified

- Added lifecycle coverage for strict supervisor invocation behavior.

## 0.1.1 - 2026-06-15

Published to npm: 2026-06-15 10:59:19 UTC

Commit: `ee4c02b`

### Added

- Added portable worker delegation for Codex and Claude Code through `workflow-supervisor delegate`.
- Added `WorkerReportV1` and `DossierV1` schema artifacts plus dossier validation before delegation.
- Added `delegate-doctor` for adapter inspection and optional probe runs.
- Added project-scope `.workflow/` ignore handling for local workflow state.
- Added portable delegation documentation and tests for install, delegation, and lifecycle behavior.

### Changed

- Renamed the primary package executable path around `workflow-supervisor` while keeping `workflow-skills` as an executable alias.
- Narrowed certified install/delegation targets to Codex, Claude Code, and generic Markdown contexts.
- Strengthened validation to include adapter metadata and schema artifacts.

### Verified

- Added Node test coverage for delegate CLI behavior, installation behavior, portable delegation, and supervisor lifecycle handling.

## 0.1.0 - 2026-06-14

Published to npm: 2026-06-14 23:35:57 UTC

Source: npm tarball contents. The GitHub release tag for this version should be a reconstructed source snapshot from the npm tarball because no exact matching commit exists in the branch history for this first publish.

### Added

- Initial npm package for the workflow-supervisor skill pack.
- Added the bundled skills: `workflow-supervisor`, `worker-roles`, `acceptance-matrix`, `dossier-builder`, `source-corpus`, `loop-policy`, `work-unit`, and `workflow-docs`.
- Added the `workflow-supervisor` and `workflow-skills` executables for listing, validating, installing, uninstalling, and emitting portable context.
- Added Codex, Claude Code, OpenCode, HermesAgent, and generic adapter metadata, plus package documentation, troubleshooting notes, compatibility notes, and a README overview.
- Added packaging metadata, test coverage, and prepublish validation through `npm run validate`.

### Verified

- Initial package validation covered skill folder structure, `SKILL.md` metadata, and publishable package layout.
