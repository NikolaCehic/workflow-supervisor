# Changelog

The 0.1.x history was reconstructed from npm publish metadata and git history. GitHub releases and npm packages are separate distribution events; a GitHub tag does not prove that the same version is available from npm.

## Unreleased

## 1.0.0 - 2026-07-13

Version 1.0 replaces the eight-skill workflow framework with one explicit verification skill and a smaller one-shot delegation contract. The default route adds no workflow artifact, while tracked and delegated routes load only the context they need.

### Breaking

- Replaced the eight discoverable 0.x skills with one explicit `workflow-supervisor` skill, invoked with host-native Codex or Claude syntax.
- Replaced `lean_work_unit_runner`, `strict_full_workflow`, and `planning_only` with the proportional `direct`, `tracked`, and `delegated` routes.
- Raised the runtime requirement from Node.js 18 to Node.js 22.
- Made strict JSON `DelegationContractV1` the preferred portable-worker input.
- Made non-PASS delegation results exit with status `2` by default; `--soft-exit` is the explicit opt-out.

### Added

- Added `context-budget` with exact UTF-8 byte counts, a documented bytes/4 token estimate, and per-profile limits.
- Added `validate-contract` for compact contracts with explicit authority provenance, inputs, write scope, expected effect, acceptance rows, checks, and stop conditions.
- Added `delegate --preview` and `--max-prompt-bytes` so callers can inspect command, guard coverage, and prompt size before model execution.
- Added compact `WorkerResultV1` model output. The wrapper joins immutable contract outcomes and normalizes the result into the existing `WorkerReportV1` envelope.
- Added a provider-intersection structured-output schema for Codex and Claude Code. Provider output is normalized and then checked against the stricter canonical `WorkerResultV1` runtime rules; provider-schema acceptance alone cannot produce PASS.
- Added exact-name credential forwarding with `--credential-env`; contract authority must name and explicitly authorize every forwarded variable.
- Added bounded process-tree execution, timeout and output-overflow cleanup, a quiescence check, and explicit platform limitations in guard warnings.
- Added owned-install locking, atomic target replacement, `upgrade`, legacy-skill cleanup, stricter `doctor` checks, and reversible project `.workflow/` ignore handling.
- Added format-aware migration for every published Codex and Claude Code `0.1.0`-`0.3.0` manifest, including frozen legacy checksums/context and conservative `.gitignore` provenance migration.
- Added a root Codex plugin and a root Claude marketplace with an entry that points to the isolated `plugins/claude` plugin. Invocation is `$workflow-supervisor` in Codex, `/workflow-supervisor` for a direct Claude skill, and `/workflow-supervisor:workflow-supervisor` for the Claude plugin.
- Added CI validation on Ubuntu with Node.js 22, 24, and 26 and on macOS and Windows with Node.js 24, plus a fresh-consumer tarball smoke test.
- Added tagged-release assets for the verified tarball, SHA-256 checksums, a CycloneDX SBOM, and an in-toto provenance statement.
- Added migration, security, contribution, conduct, support, compatibility, CLI, artifact, and troubleshooting documentation for the v1 boundary.

### Changed

- Reduced the discoverable catalog to one skill and moved tracked/delegated detail into route-specific references.
- Removed dossier-owned worker prompts and duplicated wrapper metadata from the preferred worker input/output path.
- Limited worker environments to a small runtime allowlist plus exact authorized credential variables.
- Required custom adapter commands to opt into `--unsafe-adapter-override`.
- Made the Claude one-shot adapter disable skills and configured MCP servers while preserving normal OAuth/keychain authentication; it deliberately does not use `--bare`.
- Honored Claude Code's documented `CLAUDE_CONFIG_DIR` for user-scope skill discovery and delegated-process configuration.
- Reconciled worker-reported changes with wrapper-observed workspace changes and rejected `mutation_required` PASS when no mutation was observed.
- Preserved Git commit and content hashes during diagnostic redaction while continuing to remove credential-shaped material.
- Restricted result extraction to direct output, Claude's successful `structured_output`, or the final Codex `agent_message`; arbitrary command logs and stderr can no longer impersonate a terminal worker result.
- Required direct and final-agent-message carriers to contain only JSON result objects with whitespace separators; surrounding prose can no longer be silently ignored.
- Extended the mutation guard across embedded repositories, registered submodules, the full Git control tree, and every workspace-visible symlink in the watched repository root.
- Preserved legacy DossierV1 forbidden surfaces through migration and rejected ambiguous path/inline contract sources.
- Kept trusted report IDs, enums, and validated paths structurally stable while scrubbing forwarded credential values from untrusted text and diagnostics; credentials equal to reserved protocol identifiers now block before launch.

### Compatibility

- `DossierV1` input remains available through `validate-dossier`, `--dossier`, and `--dossier-text`; delegation converts it to the compact contract and emits a deprecation warning.
- Legacy raw `WorkerReportV1` model output remains accepted when it satisfies the strict legacy schema; `WorkerResultV1` is preferred.
- Automated delegation remains limited to local Codex and Claude Code CLIs. Generic agents support installation and Markdown context export only.
- Automatic v1 upgrade supports published Codex and Claude Code installs from `0.1.0` through `0.3.0`. Retired OpenCode and HermesAgent copies created by `0.1.0` require the backed-up cleanup sequence in the migration guide.
- The mutation guard remains detective, scoped to `--cwd`, and unable to guarantee cleanup of deliberately detached descendants. Native permissions and operating-system isolation remain the enforcement boundary.

### Distribution

- The `v1.0.0` GitHub release ships first with the verified tarball, `SHA256SUMS`, `sbom.cdx.json`, and `provenance.intoto.json`. npm publication is a later, separate maintainer action; consumers must check `npm view workflow-supervisor version` before assuming npm carries this release.

## 0.3.0 - 2026-07-13

Reframed Workflow Supervisor as a portable verification and workflow-contract layer that complements native Codex and Claude Code orchestration. This release reduces model-facing overhead while hardening delegation, evidence, filesystem boundaries, installation, and packaging.

### Changed

- Reduced core supervisor prompt weight through profile routing, on-demand roles, progressive disclosure, explicit invocation metadata, and lean portable context defaults.
- Aligned role, authority, waiver, dossier, lifecycle, and verification guidance across all eight skills and their durable templates.
- Aligned the built-in Codex and Claude Code adapters with their documented non-interactive, schema-output, permission, and stdin interfaces, and covered them with adapter-contract tests.

### Fixed

- Hardened DossierV1 parsing/validation against duplicate or prototype-control keys, vague or non-portable boundaries, role/authority mismatch, malformed feedback-loop waivers, and schema/runtime drift.
- Hardened WorkerReportV1 handling against multiple reports, missing or unmapped evidence, wrapper-field spoofing, self-reported boundary violations, structural redaction corruption, and diagnostic secret leakage.
- Hardened surface detection across dirty files, ignored files, nested repositories, complete Git control state, symlink escapes, hard-link aliases, and adapter failures.
- Made install, uninstall, generated context, manifests, and project ignore state ownership-aware, atomic, overlap-safe, checksum-verified, and doctor-verifiable.
- Removed stale library and test-directory package metadata so the CLI-only tarball advertises only entry points and directories it actually ships.

### Verified

- Added adversarial regressions for schema mutation, parser pollution, filesystem aliasing, adapter permission drift, credential denial, transactional installs, normalized reports, and packed-tarball operation.
- Validated the complete suite on Node.js 18, 20, 22, and 25, compiled all JSON Schemas in strict Draft 2020 mode, checked published YAML examples with Ruby Psych, and exercised the packed 48-file consumer lifecycle.

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
- Narrowed built-in install/delegation targets to Codex, Claude Code, and generic Markdown contexts.
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
