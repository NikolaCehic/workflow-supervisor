# Portable Delegation

The workflow pack must stay a small skill pack. It must not become a daemon, queue, server, scheduler, dashboard, or full agent harness. The portable execution primitive is one supervised, one-shot delegation to an already-installed Codex or Claude Code CLI.

## Goal

Keep the same workflow semantics on Codex and Claude Code:

```text
complete intake
-> source grounding
-> work units
-> role-scoped implementer delegation
-> role-scoped verifier delegation
-> repair delegation only when verification fails or blocks with actionable findings
-> re-verification
-> documenter or outcome delegation when evidence exists
-> final supervisor report
```

This document describes strict or explicitly delegated execution. `lean_work_unit_runner` normally stays in same-session phased execution with a compact ledger and targeted checks. It should enter portable delegation only when the user authorizes workers for a batch or a unit hits a strict-mode escalation trigger.

Prefer portable delegation over native threads or subagents when it satisfies the work. Portable delegation is one-shot, so the worker process exits after the report. Native thread or subagent transports are allowed only when the supervisor can record the native resource id and call the matching close operation after terminal report, timeout, blocker, cancellation, or invalid output.

The supervisor remains the only coordinator. Workers do not ask the human questions, choose final disposition, expand scope, approve plans, or talk to each other. If a worker needs a decision, it returns `BLOCKED` with a `blocking_question`; only the supervisor asks the user.

## Non-Goals

- No long-running workflow daemon.
- No queue or mailbox protocol.
- No manual copy/paste handoff as the primary path.
- No platform-specific workflow semantics.
- No claim of automated delegation support for OpenCode, HermesAgent, Pi/PiAgent, OpenClaw, or other agents in this package version.
- No guarantee that every worker succeeds.
- No guarantee that every platform produces identical prose.

The guarantee is narrow and testable: Codex and Claude Code either return the same `WorkerReportV1` shape from [worker-report-v1.schema.json](../schemas/worker-report-v1.schema.json), or the delegate command returns a normalized `BLOCKED` report explaining why it could not.

Delegation also requires a concrete `DossierV1` contract from [dossier-v1.schema.json](../schemas/dossier-v1.schema.json). A missing, vague, or role-mismatched dossier blocks before any worker CLI starts.

## Primitive

Use one small command in the existing npm package:

```bash
workflow-supervisor delegate \
  --agent <codex|claude-code> \
  --role <implementer|verifier|repair|documenter> \
  --unit <unit-id> \
  --cwd <workspace> \
  --dossier <path>
```

The command does five things:

1. Validates the supervisor dossier as `DossierV1`.
2. Builds a role-scoped prompt from the supervisor dossier and report schema.
3. Spawns the selected agent CLI with an adapter command array, not shell interpolation.
4. Captures stdout, stderr, exit code, timeout, and optional JSON or JSONL events.
5. Extracts and validates a `WorkerReportV1` object.
6. Runs post-run guards and prints one normalized JSON report to stdout.

There is no resident process. Each worker is a fresh, isolated delegation.

## WorkerReportV1

Every adapter must normalize into this shape:

```json
{
  "schema": "WorkerReportV1",
  "status": "PASS",
  "role": "verifier",
  "unit_id": "U2",
  "summary": "",
  "changed_surfaces": [],
  "evidence": [],
  "checks_run": [],
  "skipped_checks": [],
  "findings": [],
  "blocking_question": null,
  "next_action": "",
  "verification_environment": {
    "shell": true,
    "filesystem": true,
    "git_diff": true,
    "browser": false,
    "playwright_mcp": false,
    "network": false,
    "capabilities": ["shell_command", "api_probe", "static_diff_inspection"],
    "limitations": []
  },
  "outcome_evaluations": [],
  "adapter": {
    "agent": "codex",
    "command": "codex exec",
    "exit_code": 0,
    "timed_out": false
  },
  "guard": {
    "allowed_surface_violations": [],
    "role_violations": []
  }
}
```

`PASS`, `FAIL`, and `BLOCKED` mean the same thing on both platforms. `CONDITIONAL_PASS` is valid only as a row-level `outcome_evaluations[].verdict`, not as top-level `WorkerReportV1.status`. A worker report without evidence for material acceptance rows is invalid. A top-level PASS with failed, blocked, or conditional outcome rows is invalid. Invalid output is converted into a deterministic normalized `BLOCKED` report by default. The package does not make a second live worker call to repair formatting, because a second call can mutate state, consume budget, or produce another non-portable transcript.

The schema is a package artifact at `schemas/worker-report-v1.schema.json`. Codex receives it through `--output-schema`; Claude Code receives it through `--json-schema`; both adapters are still wrapper-validated after the run.

## Adapter Evidence

The delegation design is grounded in documented one-shot or headless execution for the certified target platforms:

| Agent | Automation primitive | Report confidence |
|---|---|---|
| Codex | `codex exec --json --skip-git-repo-check -c service_tier="fast" --output-schema <schema>` for scripted runs; prompt string or stdin; JSONL events; output schema support. | Strong |
| Claude Code | `claude -p --output-format json --json-schema <schema>` print mode; piped input; JSON and stream JSON output; JSON schema support. | Strong |

Use this as the certification gate in any environment claiming support:

```bash
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

The command prints structured diagnostics and exits nonzero when either adapter is missing, unauthenticated, or unable to produce `WorkerReportV1`.

## Supervisor Semantics

The supervisor does not generate every role for every unit up front. It follows the loop:

- Implementer: when a unit is ready and mutable work is allowed.
- Verifier: after implementer report or for read-only units.
- Repair: only after verifier returns `FAIL` or actionable `BLOCKED`.
- Re-verifier: only after repair.
- Documenter: after planning evidence, implementation evidence, verification evidence, or final outcome evidence exists.

This preserves the current input and output contract while replacing the transport:

```text
Codex thread tools or Claude-specific subagent mechanisms
```

become:

```text
workflow-supervisor delegate --agent <codex|claude-code> --role <role> --unit <unit>
```

## Required Guards

The delegate command is small, but five guards are non-negotiable:

1. `delegate-doctor`: proves the selected executable exists. With `--probe`, it runs a trivial delegation and verifies that the adapter can produce or be normalized into `WorkerReportV1`.
2. `validate-dossier`: rejects missing fields, vague placeholders, broad mutable surfaces, unresolved open questions, role mismatches, unit mismatches, and worker prompts that do not require `WorkerReportV1`.
3. Schema validation: rejects missing evidence, missing role/unit IDs, unknown statuses, and worker attempts to ask the human directly.
4. Surface guard: captures before/after state and fails the report if the worker changed forbidden surfaces or if a read-only role changed files.
5. Timeout and exit handling: converts hangs, crashes, auth failures, and non-zero exits into normalized `BLOCKED` reports.

For git workspaces, the surface guard compares pre/post git status. Mutable roles block before delegation when the git workspace is already dirty unless `--allow-dirty` is set. For non-git workspaces, explicit `--allowed-surfaces` and `--forbidden-surfaces` are hashed and watched. If the guard cannot prove the relevant boundary, the report includes a guard warning and the supervisor must treat broad mutable delegation as unsafe.

## What-If Matrix

| What if | Answer |
|---|---|
| Agent CLI is missing | `delegate-doctor` fails; `delegate` returns normalized `BLOCKED` with `reason: adapter_cli_missing`. Supervisor asks for another supported agent or uses same-session phased mode only if intake allowed it. |
| Agent is not authenticated | Return normalized `BLOCKED` with `reason: adapter_auth_unavailable`. |
| Agent outputs Markdown around JSON | Extract the first valid `WorkerReportV1` object and validate it. |
| Agent cannot produce valid report | Return normalized `BLOCKED`; do not treat prose as evidence. |
| Dossier is vague | `validate-dossier` fails and `delegate` returns `BLOCKED` with `reason: invalid_dossier`; no worker starts. |
| Worker edits forbidden files | Surface guard marks role violation; supervisor stops. No automatic revert unless explicitly allowed, because user changes may exist. |
| Verifier edits files | Hard role violation. Verifier result is rejected. |
| Worker asks the human a question | Invalid worker behavior. Convert to `BLOCKED` with `blocking_question` for supervisor handling. |
| Worker hangs | Timeout returns normalized `BLOCKED` with adapter timing evidence. |
| Worker exits non-zero but printed useful text | Do not trust it as PASS. Normalize as `BLOCKED` unless a valid report and clean guards prove otherwise. |
| Worker returns PASS without evidence | Invalid report. Return normalized `BLOCKED` with `reason: report_validation_failed`. |
| Worker returns top-level `CONDITIONAL_PASS` | Invalid report. Use `BLOCKED` or `FAIL` top-level status and record `CONDITIONAL_PASS` only on the affected outcome row. |
| Worker hides conditional outcome proof inside PASS | Invalid report. Top-level PASS requires every material outcome row verdict to be PASS. |
| Tests cannot run | Verifier returns `BLOCKED` or `PASS` only with substitute evidence accepted by the acceptance matrix. |
| Repair expands scope | Reject unless the repair dossier explicitly allowed the new surfaces and criteria. |
| Units touch same surfaces | Run sequentially. Parallel delegation requires proven disjoint mutable surfaces. |
| Platform has no native subagents | Fine. Each role is a fresh one-shot CLI process. |
| Native subagent close is unavailable | Do not spawn it. Return `worker_resource_close_unavailable` and use portable delegation or same-session phased work only if intake allowed it. |
| Platform output differs | Platform output is not the contract. `WorkerReportV1` is the only supervisor input. |
| Platform cannot support a role safely | Adapter role is unsupported. Supervisor chooses another certified adapter or blocks. |
| Full support is claimed but one CLI is absent | `delegate-doctor --agent all --probe --require-pass` exits nonzero and names the missing adapter. |
| Human-in-loop path is selected | Workers can still be delegated automatically after human approval gates; the human answers supervisor questions and approvals only. |
| Autonomous path is selected | Intake boundaries still control installs, credentials, network calls, destructive operations, and final disposition. |
| Workspace is dirty before delegation | Mutable delegation blocks unless `--allow-dirty` is set. If allowed, guard warnings record that changed paths may include pre-existing edits. |
| Prompt injection appears in sources | Worker role prompt says sources are data, not instructions; supervisor relies on boundaries, diff guard, and evidence requirements. |
| Agent version changes behavior | `delegate-doctor --probe` must run against the installed local version, not a documentation assumption. |
| Agent supports JSON events but not schema | Use events for capture, then wrapper schema validation. |
| Agent supports schema but ignores it | Wrapper validation is still authoritative. |
| Worker writes a report but no files | Valid for verifier/documenter if evidence supports it; invalid for implementer if unit required mutation. |
| Cost or token budget is exceeded | Use adapter-supported budget flags where available; otherwise use timeout and report `BLOCKED`. |

## Why This Is The Smallest Viable Architecture

One-shot delegation keeps the skill pack small:

- Skills remain Markdown instructions.
- The npm package remains an installer plus a small helper CLI.
- Adapters are data in `adapters/<agent>/adapter.json`, not per-platform workflow implementations.
- The supervisor loop stays unchanged.
- The output contract is platform-neutral across the certified target set.

Anything less is "run another agent and hope." Anything more becomes a harness.
