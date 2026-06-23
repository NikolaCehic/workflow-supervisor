# Changelog

This changelog was reconstructed from npm publish metadata and git history after the first four package versions were published without GitHub releases or tags.

## 0.2.0 - 2026-06-23

Prepared outcome-evaluation verification for npm publication.

### Added

- Added capability-aware outcome evaluation to `WorkerReportV1` through `verification_environment` and `outcome_evaluations`.
- Added row-level outcome verdicts so verifiers can record `CONDITIONAL_PASS` for behavior that is strongly inferred but not fully observable.
- Added verification capability metadata for checks such as browser snapshots, jsdom renders, API probes, state-machine tests, file snapshots, and static diff inspection.
- Added acceptance-matrix, dossier-builder, workflow-docs, and README guidance for expected outcomes, evidence strength, invalid PASS conditions, and capability limitations.

### Changed

- Treat implementer `PASS` as a claim that must be mapped to source requirements, acceptance rows, outcome evidence, verifier verdicts, and supervisor audit.
- Treat tests, typecheck, lint, and build as evidence types instead of automatic material-outcome proof.
- Require material outcome rows to be directly observed as `PASS`, blocked, or explicitly waived before final green status.

### Fixed

- Reject top-level `CONDITIONAL_PASS` as an invalid `WorkerReportV1.status`.
- Reject top-level `PASS` reports when any outcome row is failed, blocked, or only conditionally observed.
- Reject `PASS` outcome rows without row-mapped evidence and reject unknown verification capabilities.
- Prevent unavailable browser, visual, live-service, credential, network, or human-review proof from being hidden inside final PASS reports.

### Verified

- Expanded delegate CLI tests for conditional outcome rows, missing row evidence, and unknown capabilities.
- Expanded lifecycle tests to assert outcome verification rules across supervisor, acceptance matrix, dossier, workflow docs, README, troubleshooting, and schema artifacts.
- Validated the package with `npm run validate` before release prep.

## 0.1.4 - 2026-06-19

Prepared for npm publication.

### Added

- Added profile-based supervisor execution with `lean_work_unit_runner`, `strict_full_workflow`, and `planning_only`.
- Added compact lean-runner ledger guidance for large bounded backlogs that need lower memory and less ceremony.
- Added native worker resource lifecycle rules for thread and subagent transports.

### Changed

- Changed strict worker lifecycle from logical closeout only to `planned -> handed_off -> acknowledged -> reported -> verified -> resource_closed -> closed`.
- Required native worker transports to record resource ids, close actions, and close results before final workflow outcome.
- Made one-shot portable delegation the preferred worker path when it satisfies the work, because it avoids resident native workers.

### Fixed

- Prevented completed Codex subagents from remaining open after workflow-supervisor runs by requiring `close_agent` for every recorded native `agent_id`.
- Blocked final PASS when any native worker has no recorded close result.
- Reduced large-backlog memory pressure by defaulting lean execution to same-session phased work unless workers are explicitly authorized or risk escalation requires them.

### Verified

- Expanded lifecycle tests to cover profile selection, lean ledgers, native worker resource ids, `close_agent`, and close-result gates.

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

Source: npm tarball contents. The GitHub release tag for this version is a reconstructed source snapshot from the npm tarball because no exact matching commit exists in the branch history for this first publish.

### Added

- Initial npm package for the workflow-supervisor skill pack.
- Added the bundled skills: `workflow-supervisor`, `worker-roles`, `acceptance-matrix`, `dossier-builder`, `source-corpus`, `loop-policy`, `work-unit`, and `workflow-docs`.
- Added the `workflow-supervisor` and `workflow-skills` executables for listing, validating, installing, uninstalling, and emitting portable context.
- Added Codex, Claude Code, OpenCode, HermesAgent, and generic adapter metadata, plus package documentation, troubleshooting notes, compatibility notes, and a README overview.
- Added packaging metadata, test coverage, and prepublish validation through `npm run validate`.

### Verified

- Initial package validation covered skill folder structure, `SKILL.md` metadata, and publishable package layout.
