# Portable Delegation

The workflow pack must stay a small skill pack. It must not become a daemon, queue, server, scheduler, dashboard, or full agent harness. The portable execution primitive is one supervised, one-shot delegation to an already-installed Codex or Claude Code CLI.

## Goal

Keep the same workflow semantics on Codex and Claude Code:

```text
proportional intake and authority check
-> source grounding only when material
-> direct execution or bounded work units
-> role-scoped workers only when their role is needed
-> repair and re-verification only after an actionable FAIL or BLOCKED
-> durable documentation only when it has a consumer
-> evidence-backed supervisor report
```

This document describes strict or delegated execution. `lean_work_unit_runner` normally stays in same-session phased execution with a compact ledger and targeted checks. It should enter portable delegation only when an independent worker materially improves the outcome, its authority is already inside the user's scope, and the extra process cost is justified.

Prefer portable delegation over native threads or subagents when it satisfies the work. Portable delegation is one-shot, so the worker process exits after the report. Use a native thread or subagent only when its actual lifecycle can be observed and finalized with operations exposed by the current environment. Record the native resource id when available; never require or invent a close operation when the transport owns completed-resource lifecycle automatically.

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

The command does six things:

1. Validates the supervisor dossier as `DossierV1`.
2. Builds a role-scoped prompt from the supervisor dossier and report schema.
3. Spawns the selected agent CLI with an adapter command array, not shell interpolation.
4. Captures stdout, stderr, exit code, timeout, and optional JSON or JSONL events.
5. Extracts and validates a `WorkerReportV1` object.
6. Runs post-run guards and prints one normalized JSON report to stdout.

There is no resident process. Each worker is a fresh one-shot process in the governed workspace. This process boundary separates transcripts, but it is not an operating-system sandbox.

## WorkerReportV1

Every adapter must normalize into this shape:

```json
{
  "schema": "WorkerReportV1",
  "status": "PASS",
  "role": "verifier",
  "unit_id": "U2",
  "summary": "Verified A1 with a real local API request and no workspace mutation.",
  "changed_surfaces": [],
  "evidence": [{"kind": "api_probe", "detail": "GET /example returned 200 and the expected body."}],
  "checks_run": [{"kind": "command", "detail": "Local API probe completed successfully."}],
  "skipped_checks": [],
  "findings": [],
  "blocking_question": null,
  "next_action": "supervisor_review",
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
  "outcome_evaluations": [
    {
      "id": "A1",
      "source_requirement": "The API returns the documented response.",
      "expected_outcome": "A real request returns the documented status and body.",
      "preferred_verification": ["api_probe"],
      "available_verification": ["api_probe"],
      "evidence_strength": {
        "strongest_possible": ["api_probe"],
        "strongest_available": ["api_probe"],
        "limitation": null
      },
      "evidence": [{"kind": "api_probe", "detail": "GET /example returned 200 and the expected body."}],
      "invalid_pass_conditions": ["typecheck only"],
      "verdict": "PASS",
      "limitation": null,
      "capability_limitations": [],
      "required_external_check": [],
      "finding": null
    }
  ],
  "adapter": {
    "agent": "codex",
    "command": ["codex", "exec", "--json", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "--output-schema", "<schema>", "-"],
    "exit_code": 0,
    "timed_out": false,
    "source": "adapter-json",
    "schema_mode": "file"
  },
  "guard": {
    "allowed_surface_violations": [],
    "role_violations": [],
    "warnings": [],
    "observed_changed_surfaces": []
  },
  "reason": null,
  "stdout_excerpt": null,
  "stderr_excerpt": null
}
```

`PASS`, `FAIL`, and `BLOCKED` mean the same thing on both platforms. `CONDITIONAL_PASS` is valid only as a row-level `outcome_evaluations[].verdict`, not as top-level `WorkerReportV1.status`. A worker report without exactly mapped evidence for every dossier acceptance-row ID is invalid. A top-level PASS with missing, unknown, duplicate, failed, blocked, or conditional outcome rows is invalid. Missing, extra, or mistyped fields and multiple conflicting report objects are rejected. Invalid output is converted into a deterministic normalized `BLOCKED` report by default. The package does not make a second live worker call to repair formatting, because a second call can mutate state, consume budget, or produce another non-portable transcript.

The normalized-envelope schema is packaged at `schemas/worker-report-v1.schema.json`, and the raw-worker reserved-null contract is at `schemas/worker-output-v1.schema.json`. Codex and Claude Code receive a dereferenced strict worker-output schema through `--output-schema` or `--json-schema`; the trusted wrapper then validates and enriches the normalized envelope.

## Adapter Evidence

The delegation design is grounded in documented one-shot or headless execution for the built-in target platforms:

Primary references: [OpenAI Codex CLI reference](https://developers.openai.com/codex/cli/reference/), [OpenAI non-interactive mode](https://developers.openai.com/codex/noninteractive/), [Claude Code CLI reference](https://code.claude.com/docs/en/cli-usage), and [Claude Code permission modes](https://code.claude.com/docs/en/permission-modes).

| Agent | Automation primitive | Report confidence |
|---|---|---|
| Codex | `codex exec --json --ephemeral --skip-git-repo-check --sandbox <role-mode> --output-schema <schema> -`; full prompt on stdin, read-only verifier sandbox, workspace-write mutation sandbox, JSONL events, and output schema support. | Strong |
| Claude Code | `claude -p --output-format json --no-session-persistence --permission-mode <role-mode> --json-schema <schema>`; full prompt on stdin, read-only verifier plan mode, edit-capable mutation mode, no saved session, and structured output. | Strong |

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
- Documenter: only when requested or necessary durable state has a consumer, after the relevant planning, implementation, verification, or outcome evidence exists.

This preserves the current input and output contract while replacing the transport:

```text
Codex thread tools or Claude-specific subagent mechanisms
```

become:

```text
workflow-supervisor delegate --agent <codex|claude-code> --role <role> --unit <unit>
```

## Required Guards

The delegate command is small, but six guards are non-negotiable:

1. `delegate-doctor`: proves the selected executable exists and, for built-in adapters, that its bounded version invocation succeeds. With `--probe`, it runs a trivial delegation and verifies that the adapter can produce or be normalized into `WorkerReportV1`.
2. `validate-dossier`: rejects missing fields, vague placeholders, broad mutable surfaces, unresolved open questions, role mismatches, unit mismatches, and worker prompts that do not require `WorkerReportV1`.
3. Schema validation: rejects missing evidence, missing role/unit IDs, unknown statuses, loose or extra fields, unmapped acceptance rows, multiple reports, and worker attempts to ask the human directly.
4. Surface guard: captures before/after content state and fails the report if the worker changed outside allowed surfaces, changed forbidden surfaces, omitted an observed changed surface, self-reported an out-of-scope/forbidden change, or changed files in a read-only role.
5. Timeout and exit handling: converts hangs, crashes, auth failures, and non-zero exits into normalized `BLOCKED` reports and still finalizes the surface guard after a started process fails.
6. Environment isolation: strips credential-like variables and language/runtime injection variables by default. Passing credential environment requires the explicit `--allow-credential-env` gate.

For Git workspaces, the guard snapshots tracked, untracked, ignored, and nested-repository worktree content plus the complete Git control directory, including objects, refs, hooks, configuration, HEAD, and index. It also snapshots every declared allowed and forbidden surface independently. Mutable roles block before delegation when the workspace is already dirty unless `--allow-dirty` is set. A permitted dirty baseline is compared by content, so unchanged user edits are not blamed and further edits to an already-dirty file are still detected. For non-Git workspaces, the complete directory tree is hashed, so creation outside the allowed surfaces cannot hide outside a short watch list. Absolute, traversal, delimiter-ambiguous, Windows-special, outward-symlinked, and multiply-linked declared surfaces are rejected. A failed baseline blocks delegation; a failed post-run snapshot is a role violation. This is a detection guard around a process, not an operating-system sandbox; use an actual sandbox when hostile code must be prevented from accessing resources outside the workspace.

## What-If Matrix

| What if | Answer |
|---|---|
| Agent CLI is missing | `delegate-doctor` fails; `delegate` returns normalized `BLOCKED` with `reason: adapter_cli_missing`. Supervisor asks for another supported agent or uses same-session phased mode only if intake allowed it. |
| Agent is not authenticated | Return normalized `BLOCKED` with `reason: adapter_auth_unavailable`. |
| Agent outputs Markdown around one JSON report | Extract the one `WorkerReportV1` object and validate it. Multiple distinct reports are rejected. |
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
| Native worker lifecycle cannot be observed or finalized with the tools actually available | Do not choose that native transport. Use a supported portable adapter or same-session phased work when allowed; otherwise return a normal supervisor `BLOCKED` outcome naming the unavailable lifecycle capability. |
| Platform output differs | Platform output is not the contract. `WorkerReportV1` is the only supervisor input. |
| Platform cannot support a role safely | Adapter role is unsupported. Supervisor chooses another supported adapter or blocks. |
| Full support is claimed but one CLI is absent | `delegate-doctor --agent all --probe --require-pass` exits nonzero and names the missing adapter. |
| Human-in-loop path is selected | Workers can still be delegated automatically after human approval gates; the human answers supervisor questions and approvals only. |
| Autonomous path is selected | Intake boundaries still control installs, credentials, network calls, destructive operations, and final disposition. |
| Workspace is dirty before delegation | Mutable delegation blocks unless `--allow-dirty` is set. If allowed, before/after content hashes separate unchanged user edits from worker changes. |
| Prompt injection appears in sources | The dossier is delimited as untrusted task data and cannot override role, guard, or report rules; the supervisor also relies on content guards and evidence requirements. |
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
- The output contract is platform-neutral across the built-in target set.

Anything less is "run another agent and hope." Anything more becomes a harness.
