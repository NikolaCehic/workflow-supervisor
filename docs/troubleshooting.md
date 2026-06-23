# Troubleshooting

## The skills trigger too often

Keep `policy.allow_implicit_invocation: false`. Use explicit `$skill-name` invocation until live routing tests prove trigger precision.

## Workflow Supervisor is used for a tiny edit

If Workflow Supervisor was not explicitly invoked and the task has obvious files, obvious acceptance, and no hard supervisor trigger, do not invoke the skill. Execute directly and run the relevant check.

If the user explicitly invoked `workflow-supervisor`, `$workflow-supervisor`, or said to use the skill, do not silently skip it. Select the lightest valid profile, usually `lean_work_unit_runner` for bounded unit work or `planning_only` when the user only needs sequencing, and explain that direct execution would normally fit a tiny edit.

## The agent cannot find the skills

Run:

```bash
workflow-skills doctor --agent codex
workflow-skills install --agent generic --target ./agent-skills --dry-run
```

Then verify the target directory contains folders such as `workflow-supervisor/SKILL.md`.

## Goal tools are unavailable

Use `.workflow/GOAL-STATE.md` or a workflow continuation document. The supervisor skill explicitly falls back to workflow docs when goal tools are unavailable or not permitted.

## Too many docs are created

Use `$workflow-docs` with a minimal artifact request. The skill must reject "create every document just in case."

## Large backlogs run slowly or exhaust memory

Use `lean_work_unit_runner` instead of `strict_full_workflow` when the source already contains clear work units and the user's priority is throughput. Keep one compact ledger with `id`, `source_ref`, `scope`, `done`, `check`, `status`, touched surfaces, and blockers. Run one unit at a time by default, avoid subagents unless explicitly authorized, avoid broad scans unless required for the current unit, and checkpoint by batch rather than rewriting full workflow docs after every unit.

Do not remove work units to make the process lean. If a unit cannot name its boundary, done signal, or targeted check, mark it `blocked` or escalate that unit to strict mode.

## Native subagents remain open after completion

Treat this as a lifecycle bug, not a cosmetic cleanup task. A terminal report or completed notification does not close a native Codex subagent. Record every native worker id in `WORKER-MAP.md`, call the native close action such as `close_agent` after the terminal report or blocker is captured, and block the final outcome if any native worker lacks a close result. Prefer one-shot portable delegation when it satisfies the work.

## Unsupported gauntlet summaries are used as proof

Unsupported external gauntlet summaries are not validation evidence. Treat them as raw leads only unless they preserve per-scenario reports, commands, artifacts, and expected outcomes that another maintainer can inspect. Use repo-native tests, fixtures, `npm run validate`, and live adapter probes such as `workflow-supervisor delegate-doctor --agent all --probe --require-pass` for real confidence.

## Verification rubber-stamps the result

Use `$acceptance-matrix` for formal evidence rows. A PASS requires row-by-row evidence or explicit waiver evidence.

## Outcome evidence is only inferred

Use row-level `CONDITIONAL_PASS` only when the strongest available checks strongly infer the expected outcome but cannot fully observe it. Record the missing capability, limitation, and required external check. Do not roll that row into a final PASS unless the user explicitly accepts the limitation as a waiver or narrowed scope.

## Browser snapshots are unavailable

Browser snapshots are a verifier adapter, not the core verification model. If browser, screenshot, Playwright, Storybook, visual diff, or manual-review capability is unavailable, use the strongest available lower-level observable contract such as jsdom render, API probe, state-machine test, file snapshot, route manifest, or static semantic diff inspection. If the source requirement truly depends on browser or visual proof, mark the row BLOCKED or `CONDITIONAL_PASS` with the limitation.

## Bug fix passes with only related checks

A related build, lint, broad test run, or inspection is not enough for a bug fix or risky behavior change unless it would catch the exact symptom. Add a red-capable feedback loop with the command, artifact, UI state, or manual check that would fail before the fix and pass after it.

If no correct test surface exists, record an architecture or verification finding and either block the row or get explicit substitute-evidence waiver from the user. Do not hide this as a skipped check in a PASS report.

## A broad roadmap becomes one giant work unit

Use the source-requirement coverage gate before work-unit finalization. Every material roadmap item, exit criterion, named integration, and numeric target should be mapped to a unit and acceptance row, explicitly deferred by the user, blocked for a decision, or marked non-material with a reason. Do not accept "future work" or residual risk notes as a substitute for work units.

## Residual risks contain required work

Treat this as FAIL or BLOCKED. Residual risks may describe remaining uncertainty after acceptance, but they must not contain unimplemented material source requirements, skipped mandatory checks, or source-of-truth deliverables that were quietly downgraded.

## Humans need to review scope before work units

Create or refresh `.workflow/SPEC.md` before final work units. The human can ask questions in the Q&A section, request revision, block the workflow, defer items, or approve. In `human_in_loop`, the supervisor must not continue to final work units, dossiers, or implementation until the SPEC decision is approved and Q&A is answered.

## Autonomous workflow paused for a human decision

Record the blocker before asking the human. When the answer arrives, update `.workflow/SPEC.md`, `.workflow/WORKFLOW.md`, `.workflow/GOAL-STATE.md`, and `DECISIONS.md` when present. Re-run only the affected coverage, SPEC, work-unit, acceptance, dossier, worker-plan, verification, or final-disposition steps. Do not restart complete intake unless the answer changes a required intake decision. If the old Codex goal is terminal blocked, reference it as history and continue from workflow state or a newly authorized goal binding.

## An existing skill folder blocks install

Use:

```bash
workflow-skills install --agent codex --force
```

Use `--dry-run` first if you want to inspect the target.
